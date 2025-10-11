import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting monster templates seed...");

  const monsterTemplates = [
    // WARRIOR Types - High defense, moderate attack
    {
      name: "Goblin Warrior",
      type: "WARRIOR",
      baseHealth: 80,
      baseAttack: 12,
      baseDefense: 8,
      attackSpeed: 1.0,
      rarity: "COMMON",
      description: "A sturdy goblin trained in combat with decent armor.",
    },
    {
      name: "Orc Brute",
      type: "WARRIOR",
      baseHealth: 120,
      baseAttack: 18,
      baseDefense: 12,
      attackSpeed: 0.8,
      rarity: "COMMON",
      description: "A massive orc warrior with thick hide and heavy weapons.",
    },
    {
      name: "Knight",
      type: "WARRIOR",
      baseHealth: 150,
      baseAttack: 20,
      baseDefense: 15,
      attackSpeed: 0.9,
      rarity: "ELITE",
      description: "A trained knight in full plate armor.",
    },
    {
      name: "Dwarf Guard",
      type: "WARRIOR",
      baseHealth: 100,
      baseAttack: 15,
      baseDefense: 18,
      attackSpeed: 1.1,
      rarity: "COMMON",
      description: "A stout dwarf defender with exceptional armor.",
    },

    // RANGER Types - Balanced stats, faster attacks
    {
      name: "Goblin Archer",
      type: "RANGER",
      baseHealth: 60,
      baseAttack: 14,
      baseDefense: 4,
      attackSpeed: 1.3,
      rarity: "COMMON",
      description: "A nimble goblin archer with quick reflexes.",
    },
    {
      name: "Bandit Scout",
      type: "RANGER",
      baseHealth: 70,
      baseAttack: 16,
      baseDefense: 6,
      attackSpeed: 1.4,
      rarity: "COMMON",
      description: "A quick bandit with balanced combat skills.",
    },
    {
      name: "Elf Ranger",
      type: "RANGER",
      baseHealth: 90,
      baseAttack: 18,
      baseDefense: 8,
      attackSpeed: 1.5,
      rarity: "ELITE",
      description: "An agile elf with superior speed and accuracy.",
    },
    {
      name: "Hunter",
      type: "RANGER",
      baseHealth: 85,
      baseAttack: 17,
      baseDefense: 7,
      attackSpeed: 1.2,
      rarity: "COMMON",
      description: "A skilled hunter with balanced combat abilities.",
    },

    // MAGE Types - Low defense, high attack
    {
      name: "Dark Mage",
      type: "MAGE",
      baseHealth: 50,
      baseAttack: 25,
      baseDefense: 2,
      attackSpeed: 1.0,
      rarity: "COMMON",
      description: "A spellcaster with powerful magic but weak defenses.",
    },
    {
      name: "Necromancer",
      type: "MAGE",
      baseHealth: 70,
      baseAttack: 30,
      baseDefense: 3,
      attackSpeed: 0.9,
      rarity: "ELITE",
      description: "A master of dark magic with devastating spells.",
    },
    {
      name: "Elemental",
      type: "MAGE",
      baseHealth: 60,
      baseAttack: 28,
      baseDefense: 4,
      attackSpeed: 1.1,
      rarity: "RARE",
      description: "A magical being of pure elemental energy.",
    },
    {
      name: "Warlock",
      type: "MAGE",
      baseHealth: 55,
      baseAttack: 26,
      baseDefense: 3,
      attackSpeed: 1.0,
      rarity: "COMMON",
      description: "A practitioner of forbidden magic arts.",
    },

    // HEALER Types - Low attack, can heal other monsters
    {
      name: "Goblin Shaman",
      type: "HEALER",
      baseHealth: 70,
      baseAttack: 8,
      baseDefense: 5,
      attackSpeed: 1.2,
      rarity: "COMMON",
      description: "A goblin shaman with healing abilities.",
      abilities: {
        heal: {
          type: "heal",
          target: "ally",
          amount: 20,
          cooldown: 10000, // 10 seconds
          description: "Heals a random ally for 20 HP",
        },
      },
    },
    {
      name: "Priest",
      type: "HEALER",
      baseHealth: 90,
      baseAttack: 10,
      baseDefense: 7,
      attackSpeed: 1.0,
      rarity: "ELITE",
      description: "A holy priest with powerful healing magic.",
      abilities: {
        heal: {
          type: "heal",
          target: "ally",
          amount: 30,
          cooldown: 8000, // 8 seconds
          description: "Heals a random ally for 30 HP",
        },
      },
    },
    {
      name: "Druid",
      type: "HEALER",
      baseHealth: 80,
      baseAttack: 12,
      baseDefense: 6,
      attackSpeed: 1.1,
      rarity: "COMMON",
      description: "A nature druid with healing and support abilities.",
      abilities: {
        heal: {
          type: "heal",
          target: "ally",
          amount: 25,
          cooldown: 9000, // 9 seconds
          description: "Heals a random ally for 25 HP",
        },
      },
    },

    // TANK Types - Very high defense, low attack
    {
      name: "Stone Golem",
      type: "TANK",
      baseHealth: 200,
      baseAttack: 10,
      baseDefense: 20,
      attackSpeed: 0.6,
      rarity: "ELITE",
      description: "A massive stone construct with incredible defenses.",
    },
    {
      name: "Iron Sentinel",
      type: "TANK",
      baseHealth: 180,
      baseAttack: 12,
      baseDefense: 22,
      attackSpeed: 0.7,
      rarity: "RARE",
      description: "An ancient iron guardian with impenetrable armor.",
    },
    {
      name: "Turtle Guardian",
      type: "TANK",
      baseHealth: 160,
      baseAttack: 8,
      baseDefense: 25,
      attackSpeed: 0.5,
      rarity: "COMMON",
      description: "A massive turtle with a shell like steel.",
    },

    // BERSERKER Types - High attack, low defense
    {
      name: "Troll Berserker",
      type: "BERSERKER",
      baseHealth: 100,
      baseAttack: 30,
      baseDefense: 3,
      attackSpeed: 1.0,
      rarity: "ELITE",
      description: "A raging troll with devastating attacks but poor defenses.",
    },
    {
      name: "Barbarian",
      type: "BERSERKER",
      baseHealth: 90,
      baseAttack: 28,
      baseDefense: 4,
      attackSpeed: 1.1,
      rarity: "COMMON",
      description: "A savage warrior who fights with reckless abandon.",
    },
    {
      name: "Rage Demon",
      type: "BERSERKER",
      baseHealth: 80,
      baseAttack: 32,
      baseDefense: 2,
      attackSpeed: 1.2,
      rarity: "RARE",
      description: "A demon consumed by rage with overwhelming power.",
    },

    // BOSS Types - High stats, multiple abilities
    {
      name: "Dragon",
      type: "MAGE",
      baseHealth: 500,
      baseAttack: 50,
      baseDefense: 15,
      attackSpeed: 0.8,
      rarity: "BOSS",
      description: "An ancient dragon with devastating breath attacks.",
      abilities: {
        fireBreath: {
          type: "aoe",
          damage: 40,
          cooldown: 15000, // 15 seconds
          description: "Breathes fire dealing 40 damage to all enemies",
        },
        heal: {
          type: "heal",
          target: "self",
          amount: 50,
          cooldown: 20000, // 20 seconds
          description: "Heals itself for 50 HP",
        },
      },
    },
    {
      name: "Lich King",
      type: "MAGE",
      baseHealth: 400,
      baseAttack: 45,
      baseDefense: 12,
      attackSpeed: 0.9,
      rarity: "BOSS",
      description: "An undead sorcerer king with dark magic.",
      abilities: {
        deathBolt: {
          type: "single",
          damage: 60,
          cooldown: 12000, // 12 seconds
          description: "Fires a bolt of death dealing 60 damage",
        },
        summonSkeleton: {
          type: "summon",
          cooldown: 25000, // 25 seconds
          description: "Summons a skeleton warrior to aid in battle",
        },
      },
    },
    {
      name: "Orc Warlord",
      type: "WARRIOR",
      baseHealth: 450,
      baseAttack: 40,
      baseDefense: 18,
      attackSpeed: 0.7,
      rarity: "BOSS",
      description: "A massive orc leader with battle experience.",
      abilities: {
        warCry: {
          type: "buff",
          effect: "damage_boost",
          amount: 1.5,
          duration: 10000, // 10 seconds
          cooldown: 20000, // 20 seconds
          description: "Increases damage of all allies by 50% for 10 seconds",
        },
        charge: {
          type: "single",
          damage: 50,
          cooldown: 15000, // 15 seconds
          description: "Charges at an enemy dealing 50 damage",
        },
      },
    },
  ];

  for (const template of monsterTemplates) {
    const existing = await prisma.monsterTemplate.findFirst({
      where: { name: template.name },
    });

    if (!existing) {
      await prisma.monsterTemplate.create({
        data: template as any,
      });
      console.log(`✓ Created monster template: ${template.name}`);
    } else {
      await prisma.monsterTemplate.update({
        where: { id: existing.id },
        data: template as any,
      });
      console.log(`✓ Updated monster template: ${template.name}`);
    }
  }

  console.log("🌱 Monster templates seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding monster templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
