-- CreateEnum
CREATE TYPE "EquipmentSlot" AS ENUM ('WEAPON', 'OFF_HAND', 'HEAD', 'CHEST', 'LEGS', 'BOOTS', 'GLOVES', 'RING', 'AMULET');

-- AlterEnum
ALTER TYPE "ItemType" ADD VALUE 'ACCESSORY';

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "equippedAmulet" TEXT,
ADD COLUMN     "equippedBoots" TEXT,
ADD COLUMN     "equippedChest" TEXT,
ADD COLUMN     "equippedGloves" TEXT,
ADD COLUMN     "equippedHead" TEXT,
ADD COLUMN     "equippedLegs" TEXT,
ADD COLUMN     "equippedOffHand" TEXT,
ADD COLUMN     "equippedRing1" TEXT,
ADD COLUMN     "equippedRing2" TEXT,
ADD COLUMN     "equippedWeapon" TEXT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "attackPercent" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "attackRequirement" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "defensePercent" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "defenseRequirement" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "equipmentSlot" "EquipmentSlot",
ADD COLUMN     "health" INTEGER,
ADD COLUMN     "levelRequirement" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "perception" INTEGER,
ADD COLUMN     "perceptionPercent" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "perceptionRequirement" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "speed" INTEGER,
ADD COLUMN     "speedPercent" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "speedRequirement" INTEGER NOT NULL DEFAULT 0;
