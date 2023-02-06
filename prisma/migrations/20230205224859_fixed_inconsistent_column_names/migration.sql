/*
  Warnings:

  - You are about to drop the column `createdAt` on the `gameevents` table. All the data in the column will be lost.
  - You are about to drop the column `eventAmount` on the `gameevents` table. All the data in the column will be lost.
  - You are about to drop the column `eventIndex` on the `gameevents` table. All the data in the column will be lost.
  - You are about to drop the column `eventType` on the `gameevents` table. All the data in the column will be lost.
  - You are about to drop the column `occuredAt` on the `gameevents` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `gameplayerstats` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `players` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[game_id,player_id,event_index]` on the table `gameevents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `event_index` to the `gameevents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `occured_at` to the `gameevents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gameevents" DROP COLUMN "createdAt",
DROP COLUMN "eventAmount",
DROP COLUMN "eventIndex",
DROP COLUMN "eventType",
DROP COLUMN "occuredAt",
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "event_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "event_index" INTEGER NOT NULL,
ADD COLUMN     "event_type" "GameEventType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "occured_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "gameplayerstats" DROP COLUMN "updatedAt",
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "games" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "players" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "gameevents_game_id_player_id_event_index_key" ON "gameevents"("game_id", "player_id", "event_index");
