-- AlterTable
ALTER TABLE "public"."case" ADD COLUMN     "deepgramModel" TEXT,
ADD COLUMN     "deepgramRequestId" TEXT,
ADD COLUMN     "transcribedAt" TIMESTAMP(3),
ADD COLUMN     "transcriptJson" JSONB,
ADD COLUMN     "transcriptText" TEXT;
