-- AlterTable
ALTER TABLE "public"."case" ADD COLUMN     "clarificationNeeded" TEXT[],
ADD COLUMN     "extractedAt" TIMESTAMP(3),
ADD COLUMN     "extractionJson" JSONB,
ADD COLUMN     "extractionModel" TEXT,
ADD COLUMN     "extractionRequestId" TEXT,
ADD COLUMN     "intakeDraft" JSONB;
