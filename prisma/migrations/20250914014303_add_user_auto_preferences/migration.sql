-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "autoExtract" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoTranscribe" BOOLEAN NOT NULL DEFAULT false;
