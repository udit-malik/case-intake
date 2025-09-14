-- CreateEnum
CREATE TYPE "public"."CaseStatus" AS ENUM ('UPLOADED', 'TRANSCRIBED', 'EXTRACTED', 'SCORED', 'DECIDED');

-- CreateTable
CREATE TABLE "public"."case" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."CaseStatus" NOT NULL DEFAULT 'UPLOADED',
    "fileKey" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "audioSha256" TEXT,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "case_userId_createdAt_idx" ON "public"."case"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."case" ADD CONSTRAINT "case_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
