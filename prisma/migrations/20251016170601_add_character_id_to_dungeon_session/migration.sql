/*
  Warnings:

  - You are about to drop the column `completedAt` on the `DungeonSession` table. All the data in the column will be lost.
  - You are about to drop the column `currentEventId` on the `DungeonSession` table. All the data in the column will be lost.
  - You are about to drop the column `currentTurn` on the `DungeonSession` table. All the data in the column will be lost.
  - You are about to drop the column `maxTurns` on the `DungeonSession` table. All the data in the column will be lost.
  - You are about to drop the column `nextEventSpawnTime` on the `DungeonSession` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `DungeonSession` table. All the data in the column will be lost.
  - You are about to drop the column `turnEndsAt` on the `DungeonSession` table. All the data in the column will be lost.
  - You are about to drop the column `turnTimeLimit` on the `DungeonSession` table. All the data in the column will be lost.
  - You are about to drop the column `bossTemplateId` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `failCondition` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `maxEventInterval` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `maxMonstersPerEncounter` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `minEventInterval` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the column `missionType` on the `Mission` table. All the data in the column will be lost.
  - You are about to drop the `DungeonEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DungeonPlayerAction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MissionEventTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."DungeonEvent" DROP CONSTRAINT "DungeonEvent_parentEventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DungeonEvent" DROP CONSTRAINT "DungeonEvent_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DungeonEvent" DROP CONSTRAINT "DungeonEvent_templateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DungeonPlayerAction" DROP CONSTRAINT "DungeonPlayerAction_characterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DungeonPlayerAction" DROP CONSTRAINT "DungeonPlayerAction_eventId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MissionEventTemplate" DROP CONSTRAINT "MissionEventTemplate_eventTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MissionEventTemplate" DROP CONSTRAINT "MissionEventTemplate_missionId_fkey";

-- AlterTable
ALTER TABLE "DungeonSession" DROP COLUMN "completedAt",
DROP COLUMN "currentEventId",
DROP COLUMN "currentTurn",
DROP COLUMN "maxTurns",
DROP COLUMN "nextEventSpawnTime",
DROP COLUMN "startedAt",
DROP COLUMN "turnEndsAt",
DROP COLUMN "turnTimeLimit",
ADD COLUMN     "characterId" TEXT;

-- AlterTable
ALTER TABLE "Mission" DROP COLUMN "bossTemplateId",
DROP COLUMN "failCondition",
DROP COLUMN "maxEventInterval",
DROP COLUMN "maxMonstersPerEncounter",
DROP COLUMN "minEventInterval",
DROP COLUMN "missionType";

-- AlterTable
ALTER TABLE "NPCCompanion" ADD COLUMN     "currentHealth" INTEGER NOT NULL DEFAULT 100;

-- DropTable
DROP TABLE "public"."DungeonEvent";

-- DropTable
DROP TABLE "public"."DungeonPlayerAction";

-- DropTable
DROP TABLE "public"."EventTemplate";

-- DropTable
DROP TABLE "public"."MissionEventTemplate";

-- DropEnum
DROP TYPE "public"."EventStatus";

-- DropEnum
DROP TYPE "public"."EventType";

-- DropEnum
DROP TYPE "public"."MinigameType";

-- AddForeignKey
ALTER TABLE "DungeonSession" ADD CONSTRAINT "DungeonSession_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
