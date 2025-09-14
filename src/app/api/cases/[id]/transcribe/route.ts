import { NextRequest } from "next/server";
import { transcribeCase } from "@/lib/case.service";
import { revalidateCaseDetails, revalidateDashboard, revalidateCases } from "@/lib/revalidate";
import { withAuth, apiResponse } from "@/lib/api-utils";

async function transcribeHandler(
  request: NextRequest,
  params: any,
  user: { id: string; email: string }
) {
  const { id: caseId } = params;

  await transcribeCase(caseId, user.id);

  await Promise.all([
    revalidateCaseDetails(caseId),
    revalidateDashboard(),
    revalidateCases()
  ]);

  return apiResponse.success(null, "Case transcribed successfully");
}

export const POST = withAuth(transcribeHandler);
