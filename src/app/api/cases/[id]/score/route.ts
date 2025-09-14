import { NextRequest } from "next/server";
import { scoreCase } from "@/lib/services/case.service";
import { revalidateCaseDetails, revalidateDashboard, revalidateCases } from "@/lib/revalidate";
import { withAuth, apiResponse } from "@/lib/api-utils";

async function scoreHandler(
  request: NextRequest,
  params: any,
  user: { id: string; email: string }
) {
  const { id: caseId } = params;

  const updatedCase = await scoreCase(caseId, user.id);

  await Promise.all([
    revalidateCaseDetails(caseId),
    revalidateDashboard(),
    revalidateCases()
  ]);

  return apiResponse.success(
    {
      score: updatedCase.score,
      decision: updatedCase.decision,
      reasons: updatedCase.decisionReasons,
    },
    "Case scored successfully"
  );
}

export const POST = withAuth(scoreHandler);
