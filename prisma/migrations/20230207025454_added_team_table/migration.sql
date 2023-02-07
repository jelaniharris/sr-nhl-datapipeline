/*
  Warnings:

  - The primary key for the `gameevents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `games` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `players` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `gameevents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `player_id` on the `gameevents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `game_id` on the `gameevents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `opponent_team_id` to the `gameplayerstats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player_team_id` to the `gameplayerstats` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `game_id` on the `gameplayerstats` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `player_id` on the `gameplayerstats` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `away_team_id` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_team_id` to the `games` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `games` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `current_team_id` to the `players` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `players` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "gameevents" DROP CONSTRAINT "gameevents_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "player_id",
ADD COLUMN     "player_id" UUID NOT NULL,
DROP COLUMN "game_id",
ADD COLUMN     "game_id" UUID NOT NULL,
ADD CONSTRAINT "gameevents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "gameplayerstats" ADD COLUMN     "opponent_team_id" UUID NOT NULL,
ADD COLUMN     "player_team_id" UUID NOT NULL,
DROP COLUMN "game_id",
ADD COLUMN     "game_id" UUID NOT NULL,
DROP COLUMN "player_id",
ADD COLUMN     "player_id" UUID NOT NULL,
ALTER COLUMN "assists" SET DEFAULT 0,
ALTER COLUMN "goals" SET DEFAULT 0,
ALTER COLUMN "hits" SET DEFAULT 0,
ALTER COLUMN "misses" SET DEFAULT 0,
ALTER COLUMN "points" SET DEFAULT 0,
ALTER COLUMN "penalty_minutes" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "games" DROP CONSTRAINT "games_pkey",
ADD COLUMN     "away_team_id" UUID NOT NULL,
ADD COLUMN     "home_team_id" UUID NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "players" DROP CONSTRAINT "players_pkey",
ADD COLUMN     "current_team_id" UUID NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "apiId" INTEGER NOT NULL,
    "name" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_apiId_key" ON "teams"("apiId");

-- CreateIndex
CREATE UNIQUE INDEX "gameevents_game_id_player_id_event_index_key" ON "gameevents"("game_id", "player_id", "event_index");

-- CreateIndex
CREATE UNIQUE INDEX "gameplayerstats_game_id_player_id_key" ON "gameplayerstats"("game_id", "player_id");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_current_team_id_fkey" FOREIGN KEY ("current_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameplayerstats" ADD CONSTRAINT "gameplayerstats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameplayerstats" ADD CONSTRAINT "gameplayerstats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameplayerstats" ADD CONSTRAINT "gameplayerstats_player_team_id_fkey" FOREIGN KEY ("player_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameplayerstats" ADD CONSTRAINT "gameplayerstats_opponent_team_id_fkey" FOREIGN KEY ("opponent_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameevents" ADD CONSTRAINT "gameevents_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameevents" ADD CONSTRAINT "gameevents_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
