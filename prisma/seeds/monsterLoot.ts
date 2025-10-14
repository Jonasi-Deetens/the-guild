import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting monster loot table seed...");

  // Get monster templates
  const trainingDummy = await prisma.monsterTemplate.findUnique({
    where: { name: "Training Dummy" },
  });

  const advancedTrainingDummy = await prisma.monsterTemplate.findUnique({
    where: { name: "Advanced Training Dummy" },
  });

  const masterTrainingDummy = await prisma.monsterTemplate.findUnique({
    where: { name: "Master Training Dummy" },
  });

  if (!trainingDummy || !advancedTrainingDummy || !masterTrainingDummy) {
    console.error("❌ Could not find all training dummy templates");
    return;
  }

  // Get items for loot tables
  const bandage = await prisma.item.findUnique({ where: { name: "Bandage" } });
  const healthPotion = await prisma.item.findUnique({
    where: { name: "Health Potion" },
  });
  const greaterHealthPotion = await prisma.item.findUnique({
    where: { name: "Greater Health Potion" },
  });
  const rustySword = await prisma.item.findUnique({
    where: { name: "Rusty Sword" },
  });
  const ironBlade = await prisma.item.findUnique({
    where: { name: "Iron Blade" },
  });
  const steelLongsword = await prisma.item.findUnique({
    where: { name: "Steel Longsword" },
  });
  const leatherJerkin = await prisma.item.findUnique({
    where: { name: "Leather Jerkin" },
  });
  const goldCoin = await prisma.item.findUnique({
    where: { name: "Gold Coin" },
  });

  if (
    !bandage ||
    !healthPotion ||
    !greaterHealthPotion ||
    !rustySword ||
    !ironBlade ||
    !steelLongsword ||
    !leatherJerkin ||
    !goldCoin
  ) {
    console.error("❌ Could not find all required items");
    return;
  }

  // Training Dummy (basic) loot table
  const trainingDummyLoot = [
    {
      monsterTemplateId: trainingDummy.id,
      itemId: bandage.id,
      dropChance: 0.3, // 30%
      minQuantity: 1,
      maxQuantity: 2,
      rarityModifier: 1.0,
    },
    {
      monsterTemplateId: trainingDummy.id,
      itemId: healthPotion.id,
      dropChance: 0.15, // 15%
      minQuantity: 1,
      maxQuantity: 1,
      rarityModifier: 1.0,
    },
    {
      monsterTemplateId: trainingDummy.id,
      itemId: rustySword.id,
      dropChance: 0.05, // 5%
      minQuantity: 1,
      maxQuantity: 1,
      rarityModifier: 1.0,
    },
  ];

  // Advanced Training Dummy (intermediate) loot table
  const advancedTrainingDummyLoot = [
    {
      monsterTemplateId: advancedTrainingDummy.id,
      itemId: healthPotion.id,
      dropChance: 0.25, // 25%
      minQuantity: 1,
      maxQuantity: 2,
      rarityModifier: 1.0,
    },
    {
      monsterTemplateId: advancedTrainingDummy.id,
      itemId: ironBlade.id,
      dropChance: 0.08, // 8%
      minQuantity: 1,
      maxQuantity: 1,
      rarityModifier: 1.0,
    },
    {
      monsterTemplateId: advancedTrainingDummy.id,
      itemId: leatherJerkin.id,
      dropChance: 0.08, // 8%
      minQuantity: 1,
      maxQuantity: 1,
      rarityModifier: 1.0,
    },
  ];

  // Master Training Dummy (boss) loot table
  const masterTrainingDummyLoot = [
    {
      monsterTemplateId: masterTrainingDummy.id,
      itemId: greaterHealthPotion.id,
      dropChance: 0.4, // 40%
      minQuantity: 1,
      maxQuantity: 2,
      rarityModifier: 1.0,
    },
    {
      monsterTemplateId: masterTrainingDummy.id,
      itemId: steelLongsword.id,
      dropChance: 0.1, // 10%
      minQuantity: 1,
      maxQuantity: 1,
      rarityModifier: 1.0,
    },
    {
      monsterTemplateId: masterTrainingDummy.id,
      itemId: goldCoin.id,
      dropChance: 0.5, // 50%
      minQuantity: 5,
      maxQuantity: 15,
      rarityModifier: 1.0,
    },
  ];

  // Create all loot table entries
  const allLootEntries = [
    ...trainingDummyLoot,
    ...advancedTrainingDummyLoot,
    ...masterTrainingDummyLoot,
  ];

  for (const lootEntry of allLootEntries) {
    await prisma.monsterLootTable.upsert({
      where: {
        monsterTemplateId_itemId: {
          monsterTemplateId: lootEntry.monsterTemplateId,
          itemId: lootEntry.itemId,
        },
      },
      update: lootEntry,
      create: lootEntry,
    });
  }

  console.log(`✅ Created ${allLootEntries.length} monster loot table entries`);
  console.log("🎯 Training Dummy loot:", trainingDummyLoot.length, "items");
  console.log(
    "🎯 Advanced Training Dummy loot:",
    advancedTrainingDummyLoot.length,
    "items"
  );
  console.log(
    "🎯 Master Training Dummy loot:",
    masterTrainingDummyLoot.length,
    "items"
  );
}

main()
  .catch((e) => {
    console.error("❌ Monster loot seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
