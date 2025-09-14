import { Lucia, TimeSpan } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { prisma } from "@/lib/database/db";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },
  sessionExpiresIn: new TimeSpan(30, "d"),
  getUserAttributes: (attrs) => {
    return { email: (attrs as { email: string }).email };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: { email: string };
  }
}

export async function validateRequest() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(lucia.sessionCookieName);
  const sessionId = cookie?.value ?? null;

  if (!sessionId) return { user: null, session: null };

  try {
    const { session, user } = await lucia.validateSession(sessionId);

    // refresh or clear cookie as needed
    if (session?.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }
    if (!session) {
      const blank = lucia.createBlankSessionCookie();
      cookieStore.set(blank.name, blank.value, blank.attributes);
    }

    return { user, session };
  } catch (error) {
    logger.error("Session validation error", {
      error: error instanceof Error ? error.message : "Unknown error",
      sessionId: sessionId?.substring(0, 8) + "...",
    });
    return { user: null, session: null };
  }
}
