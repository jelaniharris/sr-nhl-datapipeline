/*
  Warnings:

  - You are about to drop the `gamePlayerStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "GameEventType" AS ENUM ('UNKNOWN', 'MISS', 'HIT', 'GOAL', 'ASSIST', 'PENALTY');

-- DropTable
DROP TABLE "gamePlayerStats";

-- CreateTable
CREATE TABLE "gameplayerstats" (
    "game_id" VARCHAR NOT NULL,
    "player_id" VARCHAR NOT NULL,
    "assists" INTEGER NOT NULL,
    "goals" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "misses" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "penalty_minutes" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "gameevents" (
    "id" TEXT NOT NULL,
    "player_id" VARCHAR,
    "eventType" "GameEventType" NOT NULL DEFAULT 'UNKNOWN',
    "eventIndex" INTEGER NOT NULL,
    "eventAmount" INTEGER NOT NULL,
    "occuredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gameevents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gameplayerstats_game_id_player_id_key" ON "gameplayerstats"("game_id", "player_id");
