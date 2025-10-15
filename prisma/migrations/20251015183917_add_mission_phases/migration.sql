/*
  Warnings:

  - A unique constraint covering the columns `[partyId,npcCompanionId]` on the table `PartyMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[partyId,characterId,npcCompanionId]` on the table `PartyMember` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESTING', 'COMPLETED');

-- DropIndex
DROP INDEX "public"."PartyMember_partyId_characterId_key";

-- AlterTable
ALTER TABLE "DungeonSession" ADD COLUMN     "currentPhaseNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "finalBossTemplateId" TEXT,
ADD COLUMN     "monsterPoolIds" TEXT[],
ADD COLUMN     "restDuration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "totalPhases" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "MissionPhase" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "status" "PhaseStatus" NOT NULL DEFAULT 'PENDING',
    "monstersSpawned" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "restStartedAt" TIMESTAMP(3),
    "restEndedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionPhase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionPhase_sessionId_idx" ON "MissionPhase"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionPhase_sessionId_phaseNumber_key" ON "MissionPhase"("sessionId", "phaseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PartyMember_partyId_npcCompanionId_key" ON "PartyMember"("partyId", "npcCompanionId");

-- CreateIndex
CREATE UNIQUE INDEX "PartyMember_partyId_characterId_npcCompanionId_key" ON "PartyMember"("partyId", "characterId", "npcCompanionId");

-- AddForeignKey
ALTER TABLE "MissionPhase" ADD CONSTRAINT "MissionPhase_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DungeonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
