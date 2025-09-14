import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/db";
import { IntakeBaseSchema } from "@/schemas/intake";
import { withAuth, validateRequest, apiResponse } from "@/lib/api-utils";

async function saveIntakeHandler(
  request: NextRequest,
  params: any,
  user: { id: string; email: string }
) {
  const { id: caseId } = params;
  const validatedBody = await validateRequest(request, IntakeBaseSchema);

  // load case
  const caseRecord = await prisma.case.findFirst({
    where: {
      id: caseId,
      userId: user.id,
    },
  });

  if (!caseRecord) {
    return apiResponse.notFound("Case not found");
  }

  // check if status is at least extracted
  if (!["EXTRACTED", "SCORED", "DECIDED"].includes(caseRecord.status)) {
    return apiResponse.error(
      "Case must be extracted before saving intake data",
      409
    );
  }

  // update with intake draft
  const updatedCase = await prisma.case.update({
    where: { id: caseId },
    data: {
      intakeDraft: validatedBody,
      clarificationNeeded: validatedBody.clarification_needed,
    },
  });

  return apiResponse.success(
    {
      clarificationCount: updatedCase.clarificationNeeded.length,
    },
    "Intake draft saved successfully"
  );
}

export const POST = withAuth(saveIntakeHandler);
