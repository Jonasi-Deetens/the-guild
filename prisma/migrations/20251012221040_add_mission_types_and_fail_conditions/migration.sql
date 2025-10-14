/*
  Warnings:

  - You are about to drop the column `health` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `timeline` on the `DungeonSession` table. All the data in the column will be lost.
  - Made the column `currentHealth` on table `Character` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "health",
ALTER COLUMN "currentHealth" SET NOT NULL,
ALTER COLUMN "currentHealth" SET DEFAULT 100;

-- AlterTable
ALTER TABLE "DungeonSession" DROP COLUMN "timeline",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 600,
ADD COLUMN     "missionEndTime" TIMESTAMP(3),
ADD COLUMN     "missionStartTime" TIMESTAMP(3),
ADD COLUMN     "nextEventSpawnTime" TIMESTAMP(3),
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "totalPausedTime" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "baseDuration" INTEGER NOT NULL DEFAULT 600,
ADD COLUMN     "bossTemplateId" TEXT,
ADD COLUMN     "environmentType" TEXT NOT NULL DEFAULT 'dungeon_corridor',
ADD COLUMN     "failCondition" TEXT NOT NULL DEFAULT 'TIME_OR_DEATH',
ADD COLUMN     "maxEventInterval" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "maxMonstersPerEncounter" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "minEventInterval" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "missionType" TEXT NOT NULL DEFAULT 'TIMED';
