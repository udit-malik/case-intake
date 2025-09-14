-- CreateEnum
CREATE TYPE "public"."Decision" AS ENUM ('ACCEPT', 'REVIEW', 'DECLINE');

-- AlterTable
ALTER TABLE "public"."case" ADD COLUMN     "decision" "public"."Decision",
ADD COLUMN     "decisionEmailId" TEXT,
ADD COLUMN     "decisionReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "score" INTEGER,
ADD COLUMN     "scoredAt" TIMESTAMP(3),
ADD COLUMN     "scoringVersion" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3);
