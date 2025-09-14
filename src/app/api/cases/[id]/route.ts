import { NextRequest } from "next/server";
import { z } from "zod";
import { deleteCase } from "@/lib/case.service";
import { withAuth, validateRequest, apiResponse } from "@/lib/api-utils";

const deleteSchema = z.object({
  deletedReason: z.string().optional(),
});

async function deleteCaseHandler(
  request: NextRequest,
  params: any,
  user: { id: string; email: string }
) {
  const { id: caseId } = params;
  const { deletedReason } = await validateRequest(request, deleteSchema);

  await deleteCase(caseId, user.id, deletedReason);

  return apiResponse.success(null, "Case deleted successfully");
}

export const DELETE = withAuth(deleteCaseHandler);
