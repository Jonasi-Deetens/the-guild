-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('COMBAT', 'TREASURE', 'TRAP', 'PUZZLE', 'CHOICE', 'REST', 'BOSS', 'BETRAYAL_OPPORTUNITY', 'NPC_ENCOUNTER', 'ENVIRONMENTAL_HAZARD');

-- CreateEnum
CREATE TYPE "MinigameType" AS ENUM ('JUMPING_GAPS', 'CLOSING_WALLS', 'LOCK_PICKING', 'RIDDLE', 'QUICK_TIME', 'NONE');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'ACTIVE', 'WAITING', 'RESOLVING', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "DungeonSession" ADD COLUMN     "currentEventId" TEXT,
ADD COLUMN     "seed" TEXT,
ADD COLUMN     "timeline" JSONB;

-- CreateTable
CREATE TABLE "EventTemplate" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "minigameType" "MinigameType",
    "config" JSONB NOT NULL,
    "outcomes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DungeonEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "templateId" TEXT,
    "eventNumber" INTEGER NOT NULL,
    "parentEventId" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "eventData" JSONB NOT NULL,
    "results" JSONB,
    "startsAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DungeonEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DungeonPlayerAction" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionData" JSONB NOT NULL,
    "result" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DungeonPlayerAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DungeonEvent_sessionId_eventNumber_idx" ON "DungeonEvent"("sessionId", "eventNumber");

-- CreateIndex
CREATE INDEX "DungeonEvent_parentEventId_idx" ON "DungeonEvent"("parentEventId");

-- CreateIndex
CREATE INDEX "DungeonPlayerAction_characterId_idx" ON "DungeonPlayerAction"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "DungeonPlayerAction_eventId_characterId_key" ON "DungeonPlayerAction"("eventId", "characterId");

-- AddForeignKey
ALTER TABLE "DungeonEvent" ADD CONSTRAINT "DungeonEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DungeonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonEvent" ADD CONSTRAINT "DungeonEvent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EventTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonEvent" ADD CONSTRAINT "DungeonEvent_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "DungeonEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonPlayerAction" ADD CONSTRAINT "DungeonPlayerAction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DungeonEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonPlayerAction" ADD CONSTRAINT "DungeonPlayerAction_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
