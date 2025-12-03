/*
  Warnings:

  - You are about to drop the column `changedBy` on the `user_status_history` table. All the data in the column will be lost.
  - Added the required column `changedById` to the `user_status_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_status_history" DROP CONSTRAINT "user_status_history_changedBy_fkey";

-- AlterTable
ALTER TABLE "user_status_history" DROP COLUMN "changedBy",
ADD COLUMN     "changedById" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "user_status_history" ADD CONSTRAINT "user_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
