-- CreateEnum
CREATE TYPE "LootDistributionType" AS ENUM ('AUTO', 'NEED_GREED', 'MASTER_LOOTER');

-- CreateEnum
CREATE TYPE "LootRollType" AS ENUM ('NEED', 'GREED');

-- AlterTable
ALTER TABLE "DungeonLoot" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "distributionType" "LootDistributionType" NOT NULL DEFAULT 'AUTO';

-- AlterTable
ALTER TABLE "Party" ADD COLUMN     "lootDistributionType" "LootDistributionType" NOT NULL DEFAULT 'NEED_GREED',
ADD COLUMN     "masterLooterId" TEXT;

-- CreateTable
CREATE TABLE "LootRoll" (
    "id" TEXT NOT NULL,
    "lootId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "rollType" "LootRollType" NOT NULL,
    "rollValue" INTEGER NOT NULL,
    "rolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LootRoll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LootRoll_lootId_characterId_key" ON "LootRoll"("lootId", "characterId");

-- AddForeignKey
ALTER TABLE "LootRoll" ADD CONSTRAINT "LootRoll_lootId_fkey" FOREIGN KEY ("lootId") REFERENCES "DungeonLoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LootRoll" ADD CONSTRAINT "LootRoll_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
