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
      equipmentSlot: "WEAPON",
      levelRequirement: 1,
    },
    {
      name: "Iron Blade",
      description:
        "A well-crafted iron sword with a sharp edge. Reliable in combat.",
      type: "WEAPON",
      rarity: "UNCOMMON",
      value: 75,
      attack: 12,
      equipmentSlot: "WEAPON",
      levelRequirement: 3,
    },
    {
      name: "Steel Longsword",
      description:
        "A masterfully forged steel sword. Cuts through armor with ease.",
      type: "WEAPON",
      rarity: "RARE",
      value: 200,
      attack: 20,
      equipmentSlot: "WEAPON",
      levelRequirement: 8,
      attackRequirement: 15,
    },
    {
      name: "Dragon Slayer",
      description:
        "A legendary blade forged in dragon fire. Said to have slain ancient beasts.",
      type: "WEAPON",
      rarity: "LEGENDARY",
      value: 1000,
      attack: 35,
      equipmentSlot: "WEAPON",
      levelRequirement: 20,
      attackRequirement: 25,
    },
    {
      name: "Goblin Dagger",
      description: "A small, quick blade favored by goblins. Light and fast.",
      type: "WEAPON",
      rarity: "COMMON",
      value: 15,
      attack: 3,
      speed: 2,
      equipmentSlot: "WEAPON",
      levelRequirement: 1,
    },
    {
      name: "War Hammer",
      description: "A heavy hammer designed for crushing armor and bones.",
      type: "WEAPON",
      rarity: "UNCOMMON",
      value: 100,
      attack: 15,
      equipmentSlot: "WEAPON",
      levelRequirement: 5,
      attackRequirement: 10,
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
      equipmentSlot: "CHEST",
      levelRequirement: 1,
    },
    {
      name: "Chain Mail",
      description:
        "Interlocked metal rings provide good protection against slashing attacks.",
      type: "ARMOR",
      rarity: "UNCOMMON",
      value: 120,
      defense: 8,
      equipmentSlot: "CHEST",
      levelRequirement: 4,
      defenseRequirement: 5,
    },
    {
      name: "Plate Armor",
      description:
        "Heavy metal plates offer excellent protection but reduce mobility.",
      type: "ARMOR",
      rarity: "RARE",
      value: 300,
      defense: 15,
      equipmentSlot: "CHEST",
      levelRequirement: 10,
      defenseRequirement: 12,
    },
    {
      name: "Dragon Scale Mail",
      description:
        "Armor crafted from the scales of an ancient dragon. Nearly impenetrable.",
      type: "ARMOR",
      rarity: "LEGENDARY",
      value: 1500,
      defense: 25,
      equipmentSlot: "CHEST",
      levelRequirement: 25,
      defenseRequirement: 20,
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

  // Head Equipment
  const headEquipment = [
    {
      name: "Leather Cap",
      description: "A simple leather cap that provides basic head protection.",
      type: "ARMOR",
      rarity: "COMMON",
      value: 20,
      defense: 2,
      equipmentSlot: "HEAD",
      levelRequirement: 1,
    },
    {
      name: "Iron Helmet",
      description: "A sturdy iron helmet that protects the head from blows.",
      type: "ARMOR",
      rarity: "UNCOMMON",
      value: 80,
      defense: 5,
      equipmentSlot: "HEAD",
      levelRequirement: 3,
      defenseRequirement: 3,
    },
    {
      name: "Crown of Wisdom",
      description: "An ancient crown that enhances the wearer's perception.",
      type: "ARMOR",
      rarity: "RARE",
      value: 400,
      defense: 3,
      perception: 5,
      perceptionPercent: 0.1,
      equipmentSlot: "HEAD",
      levelRequirement: 12,
      perceptionRequirement: 8,
    },
  ];

  // Leg Equipment
  const legEquipment = [
    {
      name: "Leather Pants",
      description: "Basic leather pants for leg protection.",
      type: "ARMOR",
      rarity: "COMMON",
      value: 25,
      defense: 2,
      equipmentSlot: "LEGS",
      levelRequirement: 1,
    },
    {
      name: "Chain Leggings",
      description: "Chain mail leggings that protect the legs.",
      type: "ARMOR",
      rarity: "UNCOMMON",
      value: 100,
      defense: 6,
      equipmentSlot: "LEGS",
      levelRequirement: 4,
      defenseRequirement: 4,
    },
    {
      name: "Plate Greaves",
      description: "Heavy metal greaves that provide excellent leg protection.",
      type: "ARMOR",
      rarity: "RARE",
      value: 250,
      defense: 12,
      equipmentSlot: "LEGS",
      levelRequirement: 10,
      defenseRequirement: 10,
    },
  ];

  // Boot Equipment
  const bootEquipment = [
    {
      name: "Leather Boots",
      description: "Sturdy leather boots for traveling.",
      type: "ARMOR",
      rarity: "COMMON",
      value: 20,
      defense: 1,
      speed: 1,
      equipmentSlot: "BOOTS",
      levelRequirement: 1,
    },
    {
      name: "Speed Boots",
      description: "Lightweight boots that enhance movement speed.",
      type: "ARMOR",
      rarity: "UNCOMMON",
      value: 150,
      defense: 2,
      speed: 3,
      speedPercent: 0.05,
      equipmentSlot: "BOOTS",
      levelRequirement: 5,
      speedRequirement: 6,
    },
    {
      name: "Boots of Swiftness",
      description: "Magical boots that greatly enhance the wearer's speed.",
      type: "ARMOR",
      rarity: "RARE",
      value: 500,
      defense: 3,
      speed: 5,
      speedPercent: 0.15,
      equipmentSlot: "BOOTS",
      levelRequirement: 15,
      speedRequirement: 12,
    },
  ];

  // Glove Equipment
  const gloveEquipment = [
    {
      name: "Leather Gloves",
      description: "Basic leather gloves for hand protection.",
      type: "ARMOR",
      rarity: "COMMON",
      value: 15,
      defense: 1,
      equipmentSlot: "GLOVES",
      levelRequirement: 1,
    },
    {
      name: "Iron Gauntlets",
      description: "Heavy iron gauntlets that enhance grip and protection.",
      type: "ARMOR",
      rarity: "UNCOMMON",
      value: 90,
      defense: 4,
      attack: 2,
      equipmentSlot: "GLOVES",
      levelRequirement: 4,
      attackRequirement: 5,
    },
    {
      name: "Power Gloves",
      description: "Magical gloves that enhance the wearer's attack power.",
      type: "ARMOR",
      rarity: "RARE",
      value: 300,
      defense: 2,
      attack: 8,
      attackPercent: 0.1,
      equipmentSlot: "GLOVES",
      levelRequirement: 12,
      attackRequirement: 15,
    },
  ];

  // Off-hand Equipment
  const offHandEquipment = [
    {
      name: "Wooden Shield",
      description: "A basic wooden shield for defense.",
      type: "ARMOR",
      rarity: "COMMON",
      value: 40,
      defense: 4,
      equipmentSlot: "OFF_HAND",
      levelRequirement: 1,
    },
    {
      name: "Iron Shield",
      description: "A sturdy iron shield that provides good protection.",
      type: "ARMOR",
      rarity: "UNCOMMON",
      value: 120,
      defense: 8,
      equipmentSlot: "OFF_HAND",
      levelRequirement: 4,
      defenseRequirement: 5,
    },
    {
      name: "Tower Shield",
      description:
        "A massive shield that provides excellent protection but reduces speed.",
      type: "ARMOR",
      rarity: "RARE",
      value: 350,
      defense: 15,
      speed: -2,
      equipmentSlot: "OFF_HAND",
      levelRequirement: 12,
      defenseRequirement: 12,
    },
  ];

  // Accessories (Rings and Amulets)
  const accessories = [
    {
      name: "Ring of Power",
      description: "A ring that enhances the wearer's attack power.",
      type: "ACCESSORY",
      rarity: "UNCOMMON",
      value: 200,
      attack: 5,
      attackPercent: 0.05,
      equipmentSlot: "RING",
      levelRequirement: 6,
      attackRequirement: 8,
    },
    {
      name: "Ring of Protection",
      description: "A ring that enhances the wearer's defense.",
      type: "ACCESSORY",
      rarity: "UNCOMMON",
      value: 200,
      defense: 5,
      defensePercent: 0.05,
      equipmentSlot: "RING",
      levelRequirement: 6,
      defenseRequirement: 8,
    },
    {
      name: "Ring of Speed",
      description: "A ring that enhances the wearer's speed.",
      type: "ACCESSORY",
      rarity: "UNCOMMON",
      value: 200,
      speed: 3,
      speedPercent: 0.05,
      equipmentSlot: "RING",
      levelRequirement: 6,
      speedRequirement: 8,
    },
    {
      name: "Ring of Wisdom",
      description: "A ring that enhances the wearer's perception.",
      type: "ACCESSORY",
      rarity: "UNCOMMON",
      value: 200,
      perception: 3,
      perceptionPercent: 0.05,
      equipmentSlot: "RING",
      levelRequirement: 6,
      perceptionRequirement: 8,
    },
    {
      name: "Amulet of Vitality",
      description: "An amulet that enhances the wearer's health.",
      type: "ACCESSORY",
      rarity: "RARE",
      value: 500,
      health: 20,
      equipmentSlot: "AMULET",
      levelRequirement: 10,
    },
    {
      name: "Amulet of the Warrior",
      description: "An amulet that enhances both attack and defense.",
      type: "ACCESSORY",
      rarity: "RARE",
      value: 800,
      attack: 8,
      defense: 8,
      attackPercent: 0.1,
      defensePercent: 0.1,
      equipmentSlot: "AMULET",
      levelRequirement: 15,
      attackRequirement: 12,
      defenseRequirement: 12,
    },
  ];

  const allItems = [
    ...weapons,
    ...armor,
    ...headEquipment,
    ...legEquipment,
    ...bootEquipment,
    ...gloveEquipment,
    ...offHandEquipment,
    ...accessories,
    ...consumables,
    ...currency,
    ...misc,
  ];

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
