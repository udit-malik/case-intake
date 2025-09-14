import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/db";
import { revalidateUserPreferences } from "@/lib/revalidate";
import { withAuth, validateRequest, apiResponse } from "@/lib/api-utils";

const updatePreferencesSchema = z.object({
  autoTranscribe: z.boolean().optional(),
  autoExtract: z.boolean().optional(),
});

async function updatePreferencesHandler(
  request: NextRequest,
  params: any,
  user: { id: string; email: string }
) {
  const { autoTranscribe, autoExtract } = await validateRequest(
    request,
    updatePreferencesSchema
  );

  // update user preferences
  const updateData: any = {};
  if (autoTranscribe !== undefined) updateData.autoTranscribe = autoTranscribe;
  if (autoExtract !== undefined) updateData.autoExtract = autoExtract;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: {
      autoTranscribe: true,
      autoExtract: true,
    },
  });

  await revalidateUserPreferences();

  return apiResponse.success(
    {
      preferences: updatedUser,
    },
    "Preferences updated successfully"
  );
}

async function getPreferencesHandler(
  request: NextRequest,
  params: any,
  user: { id: string; email: string }
) {
  const userPreferences = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      autoTranscribe: true,
      autoExtract: true,
    },
  });

  if (!userPreferences) {
    return apiResponse.notFound("User not found");
  }

  return apiResponse.success({
    preferences: userPreferences,
  });
}

export const PATCH = withAuth(updatePreferencesHandler);
export const GET = withAuth(getPreferencesHandler);
