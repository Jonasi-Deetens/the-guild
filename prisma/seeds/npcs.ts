import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const npcs = [
  // Gold-hireable NPCs (Common/Uncommon)
  {
    name: "Thorin Ironbeard",
    level: 3,
    class: "Warrior",
    description: "A sturdy dwarf warrior with a thick beard and heavy armor.",
    backstory:
      "Former guard captain who left the city guard to seek adventure and gold.",
    maxHealth: 150,
    attack: 18,
    defense: 12,
    speed: 4,
    agility: 3,
    perception: 6,
    blockStrength: 8,
    criticalChance: 0.08,
    hireCost: 75,
    unlockType: "GOLD" as const,
    rarity: "COMMON" as const,
    abilities: {
      "Shield Bash": "Stuns target for 1 turn",
      "Defensive Stance": "Increases defense by 50% for 3 turns",
    },
  },
  {
    name: "Luna Shadowstep",
    level: 4,
    class: "Rogue",
    description: "A nimble elf rogue with quick reflexes and deadly precision.",
    backstory:
      "Former thief who turned to mercenary work after a botched heist.",
    maxHealth: 90,
    attack: 25,
    defense: 6,
    speed: 12,
    agility: 15,
    perception: 14,
    blockStrength: 2,
    criticalChance: 0.2,
    hireCost: 100,
    unlockType: "GOLD" as const,
    rarity: "UNCOMMON" as const,
    abilities: {
      Backstab: "Deals 200% damage from behind",
      Stealth: "Becomes untargetable for 2 turns",
    },
  },
  {
    name: "Sister Mercy",
    level: 3,
    class: "Cleric",
    description: "A devoted healer with a gentle demeanor and powerful magic.",
    backstory:
      "Temple acolyte who left to help those in need across the realm.",
    maxHealth: 110,
    attack: 8,
    defense: 8,
    speed: 6,
    agility: 5,
    perception: 10,
    blockStrength: 4,
    criticalChance: 0.05,
    hireCost: 80,
    unlockType: "GOLD" as const,
    rarity: "COMMON" as const,
    abilities: {
      Heal: "Restores 50 HP to target",
      Blessing: "Increases party attack by 25% for 5 turns",
    },
  },
  {
    name: "Gareth Longbow",
    level: 4,
    class: "Archer",
    description: "A skilled ranger with unmatched accuracy and keen eyesight.",
    backstory: "Forest guardian who became a mercenary to protect travelers.",
    maxHealth: 100,
    attack: 22,
    defense: 7,
    speed: 10,
    agility: 12,
    perception: 16,
    blockStrength: 3,
    criticalChance: 0.15,
    hireCost: 90,
    unlockType: "GOLD" as const,
    rarity: "UNCOMMON" as const,
    abilities: {
      "Precise Shot": "Always hits and deals 150% damage",
      "Eagle Eye": "Increases critical chance by 50% for 3 turns",
    },
  },
  {
    name: "Zara Flameweaver",
    level: 5,
    class: "Mage",
    description: "A powerful sorceress with mastery over fire magic.",
    backstory:
      "Academy dropout who learned magic through dangerous experimentation.",
    maxHealth: 80,
    attack: 28,
    defense: 5,
    speed: 8,
    agility: 6,
    perception: 12,
    blockStrength: 2,
    criticalChance: 0.12,
    hireCost: 120,
    unlockType: "GOLD" as const,
    rarity: "RARE" as const,
    abilities: {
      Fireball: "Deals area damage to all enemies",
      "Flame Shield": "Reflects 50% damage back to attackers",
    },
  },
  {
    name: "Marcus Steelheart",
    level: 6,
    class: "Paladin",
    description: "A noble knight with divine powers and unwavering resolve.",
    backstory: "Former noble who took up the sword to fight for justice.",
    maxHealth: 180,
    attack: 20,
    defense: 15,
    speed: 5,
    agility: 4,
    perception: 8,
    blockStrength: 10,
    criticalChance: 0.1,
    hireCost: 150,
    unlockType: "GOLD" as const,
    rarity: "RARE" as const,
    abilities: {
      "Divine Strike": "Deals holy damage that ignores defense",
      "Lay on Hands": "Heals self and nearby allies for 75 HP",
    },
  },

  // Milestone NPCs (Epic/Legendary)
  {
    name: "Aria Stormcaller",
    level: 8,
    class: "Storm Mage",
    description:
      "A legendary mage who commands the power of storms and lightning.",
    backstory:
      "Ancient wizard who has lived for centuries, seeking worthy companions.",
    maxHealth: 120,
    attack: 35,
    defense: 8,
    speed: 10,
    agility: 8,
    perception: 18,
    blockStrength: 3,
    criticalChance: 0.18,
    hireCost: 0, // Free for milestone NPCs
    unlockType: "MILESTONE" as const,
    unlockRequirement: 50, // 50 reputation
    rarity: "EPIC" as const,
    abilities: {
      "Lightning Storm": "Deals massive damage to all enemies",
      "Storm Shield": "Absorbs damage and reflects it as lightning",
      "Wind Walk": "Increases speed by 100% for 5 turns",
    },
  },
  {
    name: "Kael Shadowbane",
    level: 10,
    class: "Shadow Assassin",
    description:
      "A master assassin who walks between shadows and strikes from darkness.",
    backstory:
      "Legendary killer who only works with those who prove their worth.",
    maxHealth: 140,
    attack: 45,
    defense: 10,
    speed: 18,
    agility: 20,
    perception: 20,
    blockStrength: 5,
    criticalChance: 0.25,
    hireCost: 0, // Free for milestone NPCs
    unlockType: "MILESTONE" as const,
    unlockRequirement: 100, // 100 reputation
    rarity: "LEGENDARY" as const,
    abilities: {
      "Shadow Strike": "Teleports behind enemy and deals 300% damage",
      "Shadow Clone": "Creates a shadow copy that fights alongside",
      "Death Mark": "Marks target for instant death if below 25% HP",
    },
  },
  {
    name: "Titan Boulderfist",
    level: 12,
    class: "Earth Guardian",
    description: "A massive earth elemental bound to protect the realm.",
    backstory: "Ancient guardian awakened by the call of a worthy champion.",
    maxHealth: 300,
    attack: 30,
    defense: 25,
    speed: 3,
    agility: 2,
    perception: 12,
    blockStrength: 20,
    criticalChance: 0.08,
    hireCost: 0, // Free for milestone NPCs
    unlockType: "MILESTONE" as const,
    unlockRequirement: 200, // 200 reputation
    rarity: "LEGENDARY" as const,
    abilities: {
      Earthquake: "Stuns all enemies for 2 turns",
      "Stone Skin": "Reduces all damage by 75% for 5 turns",
      "Mountain's Strength": "Increases attack by 100% for 3 turns",
    },
  },
];

async function main() {
  console.log("🌱 Seeding NPCs...");

  for (const npc of npcs) {
    const existing = await prisma.nPCCompanion.findUnique({
      where: { name: npc.name },
    });

    if (!existing) {
      await prisma.nPCCompanion.create({
        data: npc,
      });
      console.log(`✅ Created NPC: ${npc.name} (${npc.class}, ${npc.rarity})`);
    } else {
      console.log(`⏭️ NPC already exists: ${npc.name}`);
    }
  }

  console.log("🎉 NPC seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding NPCs:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
