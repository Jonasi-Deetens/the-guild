import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting items seed...");

  // Weapons
  const weapons = [
    {
      name: "Rusty Sword",
      description:
        "An old, worn sword that has seen better days. Still functional but not very sharp.",
      type: "WEAPON",
      rarity: "COMMON",
      value: 25,
      attack: 5,
    },
    {
      name: "Iron Blade",
      description:
        "A well-crafted iron sword with a sharp edge. Reliable in combat.",
      type: "WEAPON",
      rarity: "UNCOMMON",
      value: 75,
      attack: 12,
    },
    {
      name: "Steel Longsword",
      description:
        "A masterfully forged steel sword. Cuts through armor with ease.",
      type: "WEAPON",
      rarity: "RARE",
      value: 200,
      attack: 20,
    },
    {
      name: "Dragon Slayer",
      description:
        "A legendary blade forged in dragon fire. Said to have slain ancient beasts.",
      type: "WEAPON",
      rarity: "LEGENDARY",
      value: 1000,
      attack: 35,
    },
    {
      name: "Goblin Dagger",
      description: "A small, quick blade favored by goblins. Light and fast.",
      type: "WEAPON",
      rarity: "COMMON",
      value: 15,
      attack: 3,
    },
    {
      name: "War Hammer",
      description: "A heavy hammer designed for crushing armor and bones.",
      type: "WEAPON",
      rarity: "UNCOMMON",
      value: 100,
      attack: 15,
    },
  ];

  // Armor
  const armor = [
    {
      name: "Leather Jerkin",
      description: "Basic leather armor that provides minimal protection.",
      type: "ARMOR",
      rarity: "COMMON",
      value: 30,
      defense: 3,
    },
    {
      name: "Chain Mail",
      description:
        "Interlocked metal rings provide good protection against slashing attacks.",
      type: "ARMOR",
      rarity: "UNCOMMON",
      value: 120,
      defense: 8,
    },
    {
      name: "Plate Armor",
      description:
        "Heavy metal plates offer excellent protection but reduce mobility.",
      type: "ARMOR",
      rarity: "RARE",
      value: 300,
      defense: 15,
    },
    {
      name: "Dragon Scale Mail",
      description:
        "Armor crafted from the scales of an ancient dragon. Nearly impenetrable.",
      type: "ARMOR",
      rarity: "LEGENDARY",
      value: 1500,
      defense: 25,
    },
    {
      name: "Studded Leather",
      description:
        "Leather armor reinforced with metal studs for extra protection.",
      type: "ARMOR",
      rarity: "UNCOMMON",
      value: 80,
      defense: 6,
    },
  ];

  // Consumables
  const consumables = [
    {
      name: "Health Potion",
      description: "A red liquid that restores health when consumed.",
      type: "CONSUMABLE",
      rarity: "COMMON",
      value: 20,
      healing: 25,
    },
    {
      name: "Greater Health Potion",
      description:
        "A more potent healing potion that restores significant health.",
      type: "CONSUMABLE",
      rarity: "UNCOMMON",
      value: 50,
      healing: 50,
    },
    {
      name: "Superior Health Potion",
      description:
        "An extremely powerful healing potion that can restore most wounds.",
      type: "CONSUMABLE",
      rarity: "RARE",
      value: 150,
      healing: 100,
    },
    {
      name: "Elixir of Life",
      description:
        "A legendary potion that can heal even the most grievous wounds.",
      type: "CONSUMABLE",
      rarity: "LEGENDARY",
      value: 500,
      healing: 200,
    },
    {
      name: "Bandage",
      description: "A simple cloth bandage that provides minor healing.",
      type: "CONSUMABLE",
      rarity: "COMMON",
      value: 5,
      healing: 10,
    },
  ];

  // Currency items
  const currency = [
    {
      name: "Gold",
      description: "Universal currency used throughout the realm.",
      type: "CURRENCY",
      rarity: "COMMON",
      value: 1,
      isTradeable: true,
      isStackable: true,
      maxStack: 999999,
    },
  ];

  // Misc items
  const misc = [
    {
      name: "Gold Coin",
      description: "A shiny gold coin. The currency of the realm.",
      type: "MISC",
      rarity: "COMMON",
      value: 1,
    },
    {
      name: "Silver Ring",
      description: "A simple silver ring. Worth more than its weight in gold.",
      type: "MISC",
      rarity: "UNCOMMON",
      value: 50,
    },
    {
      name: "Ruby Gem",
      description: "A beautiful red gemstone that sparkles in the light.",
      type: "MISC",
      rarity: "RARE",
      value: 200,
    },
    {
      name: "Ancient Artifact",
      description:
        "A mysterious artifact from a bygone era. Its true value is unknown.",
      type: "MISC",
      rarity: "LEGENDARY",
      value: 1000,
    },
  ];

  const allItems = [...weapons, ...armor, ...consumables, ...currency, ...misc];

  console.log("📝 Creating items...");

  for (const item of allItems) {
    const existing = await prisma.item.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      console.log(`⊘ Item already exists: ${item.name}`);
    } else {
      await prisma.item.create({
        data: item as any,
      });
      console.log(`✅ Created item: ${item.name}`);
    }
  }

  console.log("✅ Items seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
