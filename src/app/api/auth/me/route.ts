import { NextRequest } from "next/server";
import { withAuth, apiResponse } from "@/lib/api-utils";

async function meHandler(
  request: NextRequest,
  params: any,
  user: { id: string; email: string }
) {
  return apiResponse.success({
    user: {
      id: user.id,
      email: user.email,
    },
  });
}

export const GET = withAuth(meHandler);
