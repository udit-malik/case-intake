import { NextRequest } from "next/server";
import { submitDecision } from "@/lib/case.service";
import { revalidateCaseDetails, revalidateDashboard, revalidateCases } from "@/lib/revalidate";
import { withAuth, apiResponse } from "@/lib/api-utils";

async function submitHandler(
  request: NextRequest,
  params: any,
  user: { id: string; email: string }
) {
  const { id: caseId } = params;

  await submitDecision(caseId, user.id);

  await Promise.all([
    revalidateCaseDetails(caseId),
    revalidateDashboard(),
    revalidateCases()
  ]);

  return apiResponse.success(null, "Decision submitted successfully");
}

export const POST = withAuth(submitHandler);
