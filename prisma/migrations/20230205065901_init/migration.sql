-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "statusCode" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "name" VARCHAR NOT NULL,
    "age" INTEGER NOT NULL,
    "number" VARCHAR NOT NULL,
    "position" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamePlayerStats" (
    "game_id" VARCHAR NOT NULL,
    "player_id" VARCHAR NOT NULL,
    "assists" INTEGER NOT NULL,
    "goals" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "penalty_minutes" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "gamePlayerStats_game_id_player_id_key" ON "gamePlayerStats"("game_id", "player_id");
