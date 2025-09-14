if (typeof window !== "undefined") {
  throw new Error("case.service.ts is server-only");
}

import { prisma } from "@/lib/database/db";
import { CaseQueries } from "@/lib/database/case.queries";
import { logger } from "@/lib/logger";
import { transcribe } from "@/lib/adapters/deepgram.adapter";
import { extract } from "@/lib/adapters/openai.adapter";
import { sendDecisionEmail } from "@/lib/adapters/email.adapter";
import { deleteFile, getSizeByHead } from "@/lib/adapters/storage.adapter";
import { canonicalizeClarifications } from "@/lib/validation/clarifications";
import { getMissingSubmitFields } from "@/lib/validation/submit-validation";
import {
  scoreCase as scoreCaseFunction,
  SCORING_VERSION,
} from "@/lib/ai";
import {
  CaseNotFoundError,
  InvalidStatusTransitionError,
  CaseAlreadyProcessedError,
  AudioTooLongError,
  MissingRequiredFieldsError,
  ValidationError,
} from "@/lib/errors";

import type { CreateCaseOptions, CaseRecord } from "@/types";

// Valid status transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  UPLOADED: ["TRANSCRIBED"],
  TRANSCRIBED: ["EXTRACTED"],
  EXTRACTED: ["SCORED"],
  SCORED: ["DECIDED"],
  DECIDED: ["DECIDED"], // allow multiple emails sent
};

function validateStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus];
  return allowedNextStatuses?.includes(newStatus) || false;
}

export async function createCase(
  options: CreateCaseOptions
): Promise<CaseRecord> {
  const { userId, file } = options;

  logger.info("Creating new case", {
    userId,
    fileKey: file.key,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  const caseRecord = await CaseQueries.create({
    userId,
    status: "UPLOADED",
    fileKey: file.key,
    fileUrl: file.url,
    originalFilename: file.name,
    mimeType: file.type,
    audioSha256: null, // Will be populated later if needed
    durationSec: null, // Will be populated during transcription
  });

  logger.info("Case created successfully", {
    caseId: caseRecord.id,
    status: caseRecord.status,
  });

  return caseRecord as CaseRecord;
}

// transcribe case
export async function transcribeCase(
  caseId: string,
  userId: string
): Promise<CaseRecord> {
  const caseRecord = await CaseQueries.findByIdForService(caseId, userId);

  if (!caseRecord) {
    throw new CaseNotFoundError(caseId);
  }

  // transition guarding
  if (!validateStatusTransition(caseRecord.status, "TRANSCRIBED")) {
    throw new InvalidStatusTransitionError(caseRecord.status, "TRANSCRIBED");
  }

  if (!caseRecord.fileUrl) {
    throw new ValidationError("No file URL available for transcription");
  }

  logger.info("Starting case transcription", {
    caseId,
    userId,
    currentStatus: caseRecord.status,
  });

  // audio duration check
  const durationResult = await getSizeByHead(caseRecord.fileUrl);

  if (!durationResult.success) {
    logger.warn(
      "Could not determine file size, proceeding with transcription",
      {
        caseId,
      }
    );
  }

  // send to Deepgram
  const transcriptionResult = await transcribe(caseRecord.fileUrl);

  if (transcriptionResult.durationSec > 300) {
    logger.warn("Audio exceeds 5 minutes, rejecting transcription", {
      caseId,
      durationSec: transcriptionResult.durationSec,
    });

    // soft delete
    await prisma.case.update({
      where: { id: caseId },
      data: {
        deletedAt: new Date(),
        deletedReason: "Audio exceeds 5 minutes",
      },
    });

    // clean from storage
    if (caseRecord.fileKey) {
      await deleteFile(caseRecord.fileKey);
    }

    throw new AudioTooLongError(transcriptionResult.durationSec);
  }

  // persist results
  const updatedCase = await CaseQueries.update(caseId, {
    status: "TRANSCRIBED",
    transcriptText: transcriptionResult.text,
    transcriptJson: undefined, 
    transcribedAt: new Date(),
    deepgramModel: transcriptionResult.modelId,
    deepgramRequestId: transcriptionResult.requestId,
    durationSec: transcriptionResult.durationSec,
  });

  logger.info("Case transcription completed", {
    caseId,
    newStatus: updatedCase.status,
    transcriptLength: transcriptionResult.text.length,
    durationSec: transcriptionResult.durationSec,
  });

  // check if auto-extract enabled
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { autoExtract: true },
    });

    if (user?.autoExtract) {
      logger.info("Auto-extract enabled, starting extraction", { caseId, userId });
      
      return await extractCase(caseId, userId);
    }
  } catch (autoExtractError) {
    logger.warn("Auto-extract failed, but transcription completed", {
      caseId,
      userId,
      error: autoExtractError instanceof Error ? autoExtractError.message : String(autoExtractError),
    });
  }

  return updatedCase as CaseRecord;
}

// extract transcript data
export async function extractCase(
  caseId: string,
  userId: string
): Promise<CaseRecord> {
  const caseRecord = await CaseQueries.findByIdForService(caseId, userId);

  if (!caseRecord) {
    throw new CaseNotFoundError(caseId);
  }

  // transition guarding
  if (!validateStatusTransition(caseRecord.status, "EXTRACTED")) {
    throw new InvalidStatusTransitionError(caseRecord.status, "EXTRACTED");
  }

  if (!caseRecord.transcriptText) {
    throw new ValidationError("No transcript text available for extraction");
  }

  // check if already extracted (idempotent)
  if (caseRecord.extractedAt) {
    throw new CaseAlreadyProcessedError("extracted");
  }

  logger.info("Starting case extraction", {
    caseId,
    userId,
    transcriptLength: caseRecord.transcriptText.length,
  });

  // Call adapter
  const extractionResult = await extract(caseRecord.transcriptText, {
    temperature: 0,
    seed: 42,
  });

  // Build clarifications array
  const clarifications = [...(extractionResult.clarifications || [])];

  // Add field flags for empty required fields
  if (
    !extractionResult.intake.date_of_birth ||
    extractionResult.intake.date_of_birth === ""
  ) {
    clarifications.push("dob");
  }

  if (!extractionResult.intake.email || extractionResult.intake.email === "") {
    clarifications.push("email");
  }

  if (
    !extractionResult.intake.incident_date ||
    extractionResult.intake.incident_date === ""
  ) {
    clarifications.push("incident_date");
  }

  if (
    !extractionResult.intake.incident_description ||
    extractionResult.intake.incident_description === ""
  ) {
    clarifications.push("incident_description");
  }

  if (
    !extractionResult.intake.client_name ||
    extractionResult.intake.client_name === ""
  ) {
    clarifications.push("client_name");
  }

  // Canonicalize clarifications
  const canonicalizedClarifications =
    canonicalizeClarifications(clarifications);

  // Update extraction result with canonicalized clarifications
  const finalData = {
    ...extractionResult.intake,
    clarification_needed: canonicalizedClarifications,
  };

  // Persist results
  const updatedCase = await CaseQueries.update(caseId, {
    status: "EXTRACTED",
    extractedAt: new Date(),
    extractionModel: extractionResult.modelId,
    extractionRequestId: extractionResult.requestId,
    extractionJson: finalData,
    intakeDraft: finalData,
    clarificationNeeded: canonicalizedClarifications,
  });

  logger.info("Case extraction completed", {
    caseId,
    newStatus: updatedCase.status,
    clarificationCount: canonicalizedClarifications.length,
    clarifications: canonicalizedClarifications,
  });

  return updatedCase as CaseRecord;
}

export async function scoreCase(
  caseId: string,
  userId: string
): Promise<CaseRecord> {
  // Load case
  const caseRecord = await CaseQueries.findByIdForService(caseId, userId);

  if (!caseRecord) {
    throw new CaseNotFoundError(caseId);
  }

  // Guard transitions
  if (!validateStatusTransition(caseRecord.status, "SCORED")) {
    throw new InvalidStatusTransitionError(caseRecord.status, "SCORED");
  }

  if (!caseRecord.intakeDraft) {
    throw new ValidationError("No intake draft available for scoring");
  }

  if (!caseRecord.transcriptText) {
    throw new ValidationError("No transcript available for scoring");
  }

  logger.info("Starting case scoring", {
    caseId,
    userId,
    currentStatus: caseRecord.status,
  });

  // Extract data for scoring
  const intake = caseRecord.intakeDraft as any;
  const transcript = caseRecord.transcriptText;
  const incidentDate = intake?.incident_date ?? null;

  // Score the case
  const scoringResult = await scoreCaseFunction({
    intake,
    transcript,
    incidentDate,
    now: new Date(),
  });

  // Persist results
  const updatedCase = await CaseQueries.update(caseId, {
    status: "SCORED",
    score: scoringResult.score,
    decision: scoringResult.decision,
    decisionReasons: scoringResult.reasons,
    clarificationNeeded: scoringResult.clarifications,
    scoringTrace: scoringResult.trace,
    scoredAt: new Date(),
    scoringVersion: SCORING_VERSION,
  });

  logger.info("Case scoring completed", {
    caseId,
    newStatus: updatedCase.status,
    score: scoringResult.score,
    decision: scoringResult.decision,
    scoringVersion: SCORING_VERSION,
  });

  return updatedCase as CaseRecord;
}

export async function submitDecision(
  caseId: string,
  userId: string
): Promise<CaseRecord> {
  // Load case
  const caseRecord = await CaseQueries.findByIdForService(caseId, userId);

  if (!caseRecord) {
    throw new CaseNotFoundError(caseId);
  }


  if (!validateStatusTransition(caseRecord.status, "DECIDED")) {
    throw new InvalidStatusTransitionError(caseRecord.status, "DECIDED");
  }

  if (!caseRecord.intakeDraft) {
    throw new ValidationError("No intake draft found");
  }

  logger.info("Starting case submission", {
    caseId,
    userId,
    currentStatus: caseRecord.status,
  });

  const intake = caseRecord.intakeDraft as any;

  const missingSubmitKeys = getMissingSubmitFields(intake);

  // email validation email format validation
  if (intake.email && intake.email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(intake.email.trim())) {
      missingSubmitKeys.push("email");
    }
  }

  if (missingSubmitKeys.length > 0) {
    throw new MissingRequiredFieldsError(missingSubmitKeys);
  }

  // decision compute
  let score = caseRecord.score;
  let decision = caseRecord.decision;
  let decisionReasons = caseRecord.decisionReasons || [];

  if (!score || !decision) {
    const scoringResult = await scoreCaseFunction({
      intake,
      transcript: caseRecord.transcriptText ?? "",
      incidentDate: intake.incident_date,
      now: new Date(),
    });

    score = scoringResult.score;
    decision = scoringResult.decision;
    decisionReasons = scoringResult.reasons;

    await CaseQueries.update(caseId, {
      score,
      decision,
      decisionReasons,
      clarificationNeeded: scoringResult.clarifications,
      scoredAt: new Date(),
      scoringVersion: SCORING_VERSION,
    });
  }

  // Send decision email (optional - don't fail submission if email fails)
  let emailResult: { id: string; success: boolean } = { id: "", success: false };
  try {
    emailResult = await sendDecisionEmail({
      to: intake.email.trim(),
      decision: decision as "ACCEPT" | "REVIEW" | "DECLINE",
      clientName: intake.client_name.trim(),
      caseId,
      score: score!,
      reasons: decisionReasons,
    });
  } catch (emailError) {
    logger.warn("Failed to send decision email, but continuing with submission", {
      caseId,
      emailError: emailError instanceof Error ? emailError.message : String(emailError),
      to: intake.email.trim(),
    });
  }

  // update case status
  const updatedCase = await CaseQueries.update(caseId, {
    status: "DECIDED",
    submittedAt: new Date(),
    decisionEmailId: emailResult.id || null,
  });

  logger.info("Case submission completed", {
    caseId,
    newStatus: updatedCase.status,
    decision,
    score,
    emailSent: emailResult.success,
    decisionEmailId: emailResult.id || "none",
  });

  return updatedCase as CaseRecord;
}

export async function deleteCase(
  caseId: string,
  userId: string,
  deletedReason?: string
): Promise<void> {
  const caseRecord = await CaseQueries.findByIdForService(caseId, userId);

  if (!caseRecord) {
    throw new CaseNotFoundError(caseId);
  }

  if (caseRecord.deletedAt) {
    return; 
  }

  logger.info("Deleting case", {
    caseId,
    userId,
    deletedReason,
  });

  let fileDeleted = false;
  if (caseRecord.fileKey) {
    const deleteResult = await deleteFile(caseRecord.fileKey);
    fileDeleted = deleteResult.success;
  }

  await CaseQueries.softDelete(caseId, userId, deletedReason);

  logger.info("Case deleted successfully", {
    caseId,
    userId,
    fileDeleted,
  });
}
