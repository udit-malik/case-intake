import { NextRequest } from "next/server";
import { extractCase } from "@/lib/case.service";
import { revalidateCaseDetails, revalidateDashboard, revalidateCases } from "@/lib/revalidate";
import { withAuth, apiResponse } from "@/lib/api-utils";

async function extractHandler(
  request: NextRequest,
  params: any,
  user: { id: string; email: string }
) {
  const { id: caseId } = params;

  await extractCase(caseId, user.id);

  await Promise.all([
    revalidateCaseDetails(caseId),
    revalidateDashboard(),
    revalidateCases()
  ]);

  return apiResponse.success(null, "Case data extracted successfully");
}

export const POST = withAuth(extractHandler);
