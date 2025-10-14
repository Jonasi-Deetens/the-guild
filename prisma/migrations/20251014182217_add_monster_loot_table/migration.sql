-- CreateTable
CREATE TABLE "MonsterLootTable" (
    "id" TEXT NOT NULL,
    "monsterTemplateId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "dropChance" DOUBLE PRECISION NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "rarityModifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonsterLootTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonsterLootTable_monsterTemplateId_itemId_key" ON "MonsterLootTable"("monsterTemplateId", "itemId");

-- AddForeignKey
ALTER TABLE "MonsterLootTable" ADD CONSTRAINT "MonsterLootTable_monsterTemplateId_fkey" FOREIGN KEY ("monsterTemplateId") REFERENCES "MonsterTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterLootTable" ADD CONSTRAINT "MonsterLootTable_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
