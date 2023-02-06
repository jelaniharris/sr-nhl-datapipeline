/*
  Warnings:

  - Added the required column `game_id` to the `gameevents` table without a default value. This is not possible if the table is not empty.
  - Made the column `player_id` on table `gameevents` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "gameevents" ADD COLUMN     "game_id" VARCHAR NOT NULL,
ALTER COLUMN "player_id" SET NOT NULL,
ALTER COLUMN "eventAmount" SET DEFAULT 0;
