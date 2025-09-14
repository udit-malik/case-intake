import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/db";
import { lucia } from "@/lib/auth/lucia";
import { cookies } from "next/headers";
import { verify as argon2Verify } from "@node-rs/argon2";
import { publicRoute, validateRequest, apiResponse } from "@/lib/api-utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

async function loginHandler(request: NextRequest) {
  const { email, password } = await validateRequest(request, loginSchema);

  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return apiResponse.unauthorized("No account found with this email address");
  }

  // Verify password
  const isValidPassword = await argon2Verify(user.hashedPassword, password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  if (!isValidPassword) {
    return apiResponse.unauthorized("Incorrect password");
  }

  // Create session
  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return apiResponse.success(
    {
      userId: user.id,
      email: user.email,
    },
    "Login successful"
  );
}

export const POST = publicRoute(loginHandler);
