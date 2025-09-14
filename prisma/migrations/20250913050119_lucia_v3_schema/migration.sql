/*
  Warnings:

  - You are about to drop the column `activeExpires` on the `session` table. All the data in the column will be lost.
  - You are about to drop the column `idleExpires` on the `session` table. All the data in the column will be lost.
  - You are about to drop the `key` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `expiresAt` to the `session` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."key" DROP CONSTRAINT "key_userId_fkey";

-- AlterTable
ALTER TABLE "public"."session" DROP COLUMN "activeExpires",
DROP COLUMN "idleExpires",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "public"."key";

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "public"."session"("userId");
