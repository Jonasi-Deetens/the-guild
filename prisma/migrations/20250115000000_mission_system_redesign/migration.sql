-- Migration for Mission System Redesign
-- This migration adds time-based mission system fields and handles data migration

-- Step 1: Add new columns to DungeonSession with defaults
ALTER TABLE "DungeonSession" ADD COLUMN "duration" INTEGER NOT NULL DEFAULT 600;
ALTER TABLE "DungeonSession" ADD COLUMN "missionStartTime" TIMESTAMP(3);
ALTER TABLE "DungeonSession" ADD COLUMN "missionEndTime" TIMESTAMP(3);
ALTER TABLE "DungeonSession" ADD COLUMN "pausedAt" TIMESTAMP(3);
ALTER TABLE "DungeonSession" ADD COLUMN "totalPausedTime" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DungeonSession" ADD COLUMN "nextEventSpawnTime" TIMESTAMP(3);

-- Step 2: Add new columns to Mission with defaults
ALTER TABLE "Mission" ADD COLUMN "baseDuration" INTEGER NOT NULL DEFAULT 600;
ALTER TABLE "Mission" ADD COLUMN "minEventInterval" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Mission" ADD COLUMN "maxEventInterval" INTEGER NOT NULL DEFAULT 90;
ALTER TABLE "Mission" ADD COLUMN "environmentType" TEXT NOT NULL DEFAULT 'dungeon_corridor';

-- Step 3: Handle Character health field migration
-- Update existing records to copy health to currentHealth (currentHealth already exists)
UPDATE "Character" SET "currentHealth" = "health" WHERE "health" IS NOT NULL AND "currentHealth" IS NULL;

-- Set default for any NULL values
UPDATE "Character" SET "currentHealth" = 100 WHERE "currentHealth" IS NULL;

-- Make currentHealth NOT NULL
ALTER TABLE "Character" ALTER COLUMN "currentHealth" SET NOT NULL;

-- Drop the old health column and timeline column
ALTER TABLE "DungeonSession" DROP COLUMN "timeline";
ALTER TABLE "Character" DROP COLUMN "health";
