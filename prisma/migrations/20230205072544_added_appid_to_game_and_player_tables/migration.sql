/*
  Warnings:

  - Added the required column `apiId` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apiId` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "games" ADD COLUMN     "apiId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "apiId" INTEGER NOT NULL;
