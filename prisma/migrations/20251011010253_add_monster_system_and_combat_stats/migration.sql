-- CreateEnum
CREATE TYPE "MonsterType" AS ENUM ('WARRIOR', 'RANGER', 'MAGE', 'HEALER', 'TANK', 'BERSERKER');

-- CreateEnum
CREATE TYPE "MonsterRarity" AS ENUM ('COMMON', 'ELITE', 'RARE', 'BOSS');

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "agility" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "blockStrength" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "criticalChance" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
ADD COLUMN     "currentHealth" INTEGER;

-- CreateTable
CREATE TABLE "MonsterTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MonsterType" NOT NULL,
    "baseHealth" INTEGER NOT NULL,
    "baseAttack" INTEGER NOT NULL,
    "baseDefense" INTEGER NOT NULL,
    "attackSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "canBeElite" BOOLEAN NOT NULL DEFAULT true,
    "abilities" JSONB,
    "rarity" "MonsterRarity" NOT NULL DEFAULT 'COMMON',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonsterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonsterTemplate_name_key" ON "MonsterTemplate"("name");
