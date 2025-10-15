-- CreateEnum
CREATE TYPE "NPCUnlockType" AS ENUM ('GOLD', 'MILESTONE');

-- CreateEnum
CREATE TYPE "NPCRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- AlterTable
ALTER TABLE "PartyMember" ADD COLUMN     "isNPC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "npcCompanionId" TEXT;

-- CreateTable
CREATE TABLE "NPCCompanion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "class" TEXT NOT NULL,
    "description" TEXT,
    "backstory" TEXT,
    "maxHealth" INTEGER NOT NULL DEFAULT 100,
    "attack" INTEGER NOT NULL DEFAULT 10,
    "defense" INTEGER NOT NULL DEFAULT 5,
    "speed" INTEGER NOT NULL DEFAULT 5,
    "agility" INTEGER NOT NULL DEFAULT 5,
    "perception" INTEGER NOT NULL DEFAULT 5,
    "blockStrength" INTEGER NOT NULL DEFAULT 3,
    "criticalChance" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "hireCost" INTEGER NOT NULL DEFAULT 50,
    "unlockType" "NPCUnlockType" NOT NULL DEFAULT 'GOLD',
    "unlockRequirement" INTEGER,
    "rarity" "NPCRarity" NOT NULL DEFAULT 'COMMON',
    "abilities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NPCCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HiredNPC" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "npcCompanionId" TEXT NOT NULL,
    "sessionId" TEXT,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "HiredNPC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockedNPC" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "npcCompanionId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlockedNPC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NPCCompanion_name_key" ON "NPCCompanion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HiredNPC_characterId_npcCompanionId_sessionId_key" ON "HiredNPC"("characterId", "npcCompanionId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "UnlockedNPC_characterId_npcCompanionId_key" ON "UnlockedNPC"("characterId", "npcCompanionId");

-- AddForeignKey
ALTER TABLE "PartyMember" ADD CONSTRAINT "PartyMember_npcCompanionId_fkey" FOREIGN KEY ("npcCompanionId") REFERENCES "NPCCompanion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiredNPC" ADD CONSTRAINT "HiredNPC_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiredNPC" ADD CONSTRAINT "HiredNPC_npcCompanionId_fkey" FOREIGN KEY ("npcCompanionId") REFERENCES "NPCCompanion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedNPC" ADD CONSTRAINT "UnlockedNPC_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedNPC" ADD CONSTRAINT "UnlockedNPC_npcCompanionId_fkey" FOREIGN KEY ("npcCompanionId") REFERENCES "NPCCompanion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
