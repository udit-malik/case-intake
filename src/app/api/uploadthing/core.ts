import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { UTApi } from "uploadthing/server";
import { validateRequest } from "@/lib/auth/lucia";
import { prisma } from "@/lib/database/db";
import { logger } from "@/lib/logger";

export async function deleteFileIfExists(fileKey: string): Promise<boolean> {
  try {
    const ut = new UTApi();
    await ut.deleteFiles(fileKey);
    return true;
  } catch (error) {
    logger.error("Failed to delete file from UploadThing", { error, fileKey });
    return false;
  }
}

// check audio duration using Deepgram metadata
async function checkAudioDuration(
  fileUrl: string
): Promise<{ duration: number }> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY environment variable is required");
  }

  try {
    // call with metadata-only request
    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&language=en&diarize=true&smart_format=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: fileUrl }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Deepgram API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const responseData = await response.json();

    const duration = responseData.metadata?.duration || 0;

    return { duration };
  } catch (error) {
    logger.error("Failed to check audio duration", { error, fileUrl });
    // assume valid if can't check
    return { duration: 0 };
  }
}

const f = createUploadthing();
const utapi = new UTApi();

export const ourFileRouter = {
  intakeAudio: f({ audio: { maxFileSize: "32MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) {
        throw new UploadThingError("Unauthorized");
      }

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        // reject non-MP3 (MIME must be audio/mpeg + filename ends with .mp3)
        const isValidMime = file.type === "audio/mpeg";
        const hasMp3Extension = file.name.toLowerCase().endsWith(".mp3");

        if (!isValidMime || !hasMp3Extension) {
          // delete if not MP3
          try {
            await utapi.deleteFiles(file.key);
          } catch (deleteError) {
            logger.error("Failed to delete invalid file", {
              error: deleteError,
              fileKey: file.key,
            });
          }

          logger.error("File validation failed", {
            userId: metadata.userId,
            fileKey: file.key,
            reason:
              "Invalid file type - must be MP3 with correct MIME and extension",
          });

          throw new UploadThingError("ONLY_MP3_ALLOWED");
        }

        // strict size check (30MB limit)
        const maxSizeBytes = 30 * 1024 * 1024; // 30MB
        let fileSizeBytes: number | null = null;

        // get size from UploadThing file object
        if (file.size) {
          fileSizeBytes = file.size;
        } else {
          // fallback: get content-length
          try {
            const headResponse = await fetch(file.url, { method: "HEAD" });
            const contentLength = headResponse.headers.get("content-length");
            if (contentLength) {
              fileSizeBytes = parseInt(contentLength, 10);
            }
          } catch (headError) {
            logger.warn("Failed to get file size via HEAD request", {
              userId: metadata.userId,
              fileKey: file.key,
              error: headError,
            });
          }
        }

        if (fileSizeBytes && fileSizeBytes > maxSizeBytes) {
          // delete if file too big
          try {
            await utapi.deleteFiles(file.key);
          } catch (deleteError) {
            logger.error("Failed to delete oversized file", {
              error: deleteError,
              fileKey: file.key,
            });
          }

          logger.error("File size validation failed", {
            userId: metadata.userId,
            fileKey: file.key,
            reason: `File size ${fileSizeBytes} bytes exceeds 30MB limit`,
            fileSizeBytes,
            maxSizeBytes,
          });

          throw new UploadThingError("FILE_TOO_LARGE_30MB");
        }

        // make Case record in db
        const caseRecord = await prisma.case.create({
          data: {
            userId: metadata.userId,
            status: "UPLOADED",
            fileKey: file.key,
            fileUrl: file.url,
            originalFilename: file.name,
            mimeType: file.type,
          },
        });

        // check if auto-transcribe enabled
        const user = await prisma.user.findUnique({
          where: { id: metadata.userId },
          select: { autoTranscribe: true },
        });

        // trigger transcription
        if (user?.autoTranscribe) {
          try {
            const { transcribe } = await import("@/lib/adapters/deepgram.adapter");
            const { logger } = await import("@/lib/logger");

            logger.info("Auto-transcribing case", {
              caseId: caseRecord.id,
              userId: metadata.userId,
            });

            // duration check
            const durationCheckResult = await checkAudioDuration(file.url);

            if (durationCheckResult.duration > 300) {
              logger.warn(
                "Audio exceeds 5 minutes, rejecting auto-transcription",
                {
                  caseId: caseRecord.id,
                  duration: durationCheckResult.duration,
                }
              );

              // update case failure reason
              await prisma.case.update({
                where: { id: caseRecord.id },
                data: {
                  deletedAt: new Date(),
                  deletedReason: "Audio exceeds 5 minutes",
                } as any,
              });

              try {
                await utapi.deleteFiles(file.key);
              } catch (deleteError) {
                logger.error("Failed to delete file after duration rejection", {
                  error: deleteError,
                  caseId: caseRecord.id,
                  fileKey: file.key,
                });
              }

              return {
                caseId: caseRecord.id,
                autoTranscribeFailed: "AUDIO_TOO_LONG",
              };
            }

            // deepgram transcription
            const transcriptionResult = await transcribe(file.url);

            logger.info("Auto-transcription completed", {
              caseId: caseRecord.id,
              requestId: transcriptionResult.requestId,
              model: transcriptionResult.modelId,
              textLength: transcriptionResult.text.length,
            });

            // update w/ transcription results
            await prisma.case.update({
              where: { id: caseRecord.id },
              data: {
                status: "TRANSCRIBED",
                transcriptText: transcriptionResult.text,
                transcriptJson: transcriptionResult.full,
                transcribedAt: new Date(),
                deepgramModel: transcriptionResult.modelId,
                deepgramRequestId: transcriptionResult.requestId,
              },
            });

            // check if auto-extract enabled
            const userWithExtract = await prisma.user.findUnique({
              where: { id: metadata.userId },
              select: { autoExtract: true },
            });

            if (userWithExtract?.autoExtract) {
              try {
                const { extract } = await import(
                  "@/lib/adapters/openai.adapter"
                );
                const { canonicalizeClarifications } = await import(
                  "@/lib/validation/clarifications"
                );

                logger.info("Auto-extracting case", {
                  caseId: caseRecord.id,
                  userId: metadata.userId,
                });

                const extractionResult = await extract(
                  transcriptionResult.text
                );

                logger.info("Auto-extraction completed", {
                  caseId: caseRecord.id,
                  model: extractionResult.modelId,
                  requestId: extractionResult.requestId,
                  clarificationCount:
                    extractionResult.clarifications.length,
                });

                // start building clarifications
                const clarifications = [
                  ...(extractionResult.clarifications || []),
                ];

                if (
                  !extractionResult.intake.date_of_birth ||
                  extractionResult.intake.date_of_birth === ""
                ) {
                  clarifications.push("dob");
                }
                if (
                  !extractionResult.intake.email ||
                  extractionResult.intake.email === ""
                ) {
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

                const canonicalizedClarifications =
                  canonicalizeClarifications(clarifications);

                const finalData = {
                  ...extractionResult.intake,
                  clarification_needed: canonicalizedClarifications,
                };

                await prisma.case.update({
                  where: { id: caseRecord.id },
                  data: {
                    status: "EXTRACTED",
                    extractionJson: JSON.parse(JSON.stringify(extractionResult)),
                    intakeDraft: finalData,
                    clarificationNeeded: canonicalizedClarifications,
                    extractedAt: new Date(),
                    extractionModel: extractionResult.modelId,
                    extractionRequestId: extractionResult.requestId,
                  },
                });

                logger.info("Case auto-extraction completed", {
                  caseId: caseRecord.id,
                  status: "EXTRACTED",
                });
              } catch (extractError) {
                logger.error("Auto-extraction failed", {
                  caseId: caseRecord.id,
                  error:
                    extractError instanceof Error
                      ? extractError.message
                      : "Unknown error",
                });
                // dont fail upload if extraction fails
              }
            }
          } catch (transcribeError) {
            logger.error("Auto-transcription failed", {
              caseId: caseRecord.id,
              error:
                transcribeError instanceof Error
                  ? transcribeError.message
                  : "Unknown error",
            });
            // dont fail upload if transcription fails
          }
        }

        // revalidate dash and case list after new
        const { revalidateDashboard, revalidateCases } = await import(
          "@/lib/revalidate"
        );
        await Promise.all([revalidateDashboard(), revalidateCases()]);

        return { caseId: caseRecord.id };
      } catch (e) {
        logger.error("UT onUploadComplete error", {
          caseId: metadata?.userId ? "unknown" : "not-created",
          userId: metadata?.userId || "unknown",
          fileKey: file.key,
          reason: e instanceof Error ? e.message : "unknown error",
          error: e,
        });

        if (e instanceof UploadThingError) {
          throw e;
        }

        const errorMessage = e instanceof Error ? e.message.toLowerCase() : "";
        if (errorMessage.includes("unsupported file type")) {
          throw new UploadThingError("ONLY_MP3_ALLOWED");
        }
        if (
          errorMessage.includes("file too large") ||
          errorMessage.includes("413")
        ) {
          throw new UploadThingError("FILE_TOO_LARGE_30MB");
        }

        throw new UploadThingError("UNKNOWN");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
