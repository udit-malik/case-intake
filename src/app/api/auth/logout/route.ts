import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { lucia } from "@/lib/auth/lucia";
import { publicRoute, apiResponse } from "@/lib/api-utils";

async function logoutHandler(_request: NextRequest) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(lucia.sessionCookieName);
  const sessionId = cookie?.value ?? null;

  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  const blank = lucia.createBlankSessionCookie();
  cookieStore.set(blank.name, blank.value, blank.attributes);

  return apiResponse.success(null, "Logged out successfully");
}

export const POST = publicRoute(logoutHandler);
