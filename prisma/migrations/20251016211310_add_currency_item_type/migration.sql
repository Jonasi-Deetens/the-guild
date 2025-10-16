/*
  Warnings:

  - A unique constraint covering the columns `[characterId,itemId,equipped]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "ItemType" ADD VALUE 'CURRENCY';

-- DropIndex
DROP INDEX "public"."Inventory_characterId_itemId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_characterId_itemId_equipped_key" ON "Inventory"("characterId", "itemId", "equipped");
