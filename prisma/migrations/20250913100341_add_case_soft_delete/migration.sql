-- AlterTable
ALTER TABLE "public"."case" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedReason" TEXT;
