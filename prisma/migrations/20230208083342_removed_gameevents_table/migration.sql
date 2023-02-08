/*
  Warnings:

  - You are about to drop the `gameevents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "gameevents" DROP CONSTRAINT "gameevents_game_id_fkey";

-- DropForeignKey
ALTER TABLE "gameevents" DROP CONSTRAINT "gameevents_player_id_fkey";

-- DropTable
DROP TABLE "gameevents";

-- DropEnum
DROP TYPE "GameEventType";
