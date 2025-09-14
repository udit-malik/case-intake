import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/db";
import { lucia } from "@/lib/auth/lucia";
import { cookies } from "next/headers";
import { hash as argon2Hash } from "@node-rs/argon2";
import { publicRoute, validateRequest, apiResponse } from "@/lib/api-utils";

const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

async function signupHandler(request: NextRequest) {
  const { email, password } = await validateRequest(request, signupSchema);

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiResponse.error("An account with this email already exists", 409);
  }

  // Hash password
  const hashedPassword = await argon2Hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // Create user
  const user = await prisma.user.create({
    data: { email, hashedPassword },
  });

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
    "Account created successfully"
  );
}

export const POST = publicRoute(signupHandler);
