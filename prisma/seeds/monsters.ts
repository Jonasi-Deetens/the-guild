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
    // TRAINING DUMMIES - Low stats for practice
    {
      name: "Training Dummy",
      type: "TANK",
      baseHealth: 50,
      baseAttack: 5,
      baseDefense: 3,
      attackSpeed: 1.5,
      rarity: "COMMON",
      description: "A wooden training dummy for practicing combat.",
    },
    {
      name: "Advanced Training Dummy",
      type: "WARRIOR",
      baseHealth: 75,
      baseAttack: 8,
      baseDefense: 5,
      attackSpeed: 1.2,
      rarity: "COMMON",
      description: "A sturdier training dummy with better durability.",
    },
    {
      name: "Master Training Dummy",
      type: "WARRIOR",
      baseHealth: 200,
      baseAttack: 15,
      baseDefense: 10,
      attackSpeed: 1.0,
      rarity: "BOSS",
      description:
        "The ultimate training challenge. A master-crafted dummy with advanced combat routines.",
    },
    {
      name: "Sparring Partner",
      type: "WARRIOR",
      baseHealth: 120,
      baseAttack: 12,
      baseDefense: 8,
      attackSpeed: 1.1,
      rarity: "COMMON",
      description:
        "A skilled fighter who helps you practice combat techniques.",
    },

    // BANDIT CAMP MONSTERS
    {
      name: "Bandit Thug",
      type: "WARRIOR",
      baseHealth: 60,
      baseAttack: 10,
      baseDefense: 6,
      attackSpeed: 1.0,
      rarity: "COMMON",
      description: "A low-tier bandit with basic combat skills.",
    },
    {
      name: "Bandit Crossbowman",
      type: "RANGER",
      baseHealth: 50,
      baseAttack: 12,
      baseDefense: 4,
      attackSpeed: 1.2,
      rarity: "COMMON",
      description: "A bandit armed with a crossbow for ranged attacks.",
    },
    {
      name: "Bandit Enforcer",
      type: "BERSERKER",
      baseHealth: 80,
      baseAttack: 18,
      baseDefense: 3,
      attackSpeed: 1.1,
      rarity: "ELITE",
      description: "A dangerous bandit enforcer with high damage potential.",
    },
    {
      name: "Bandit Captain",
      type: "WARRIOR",
      baseHealth: 120,
      baseAttack: 16,
      baseDefense: 10,
      attackSpeed: 0.9,
      rarity: "BOSS",
      description:
        "The leader of the bandit camp with well-rounded combat abilities.",
      abilities: {
        rally: {
          type: "buff",
          effect: "damage_boost",
          amount: 1.3,
          duration: 8000,
          cooldown: 20000,
          description: "Rallies nearby bandits, increasing their damage by 30%",
        },
        heavyStrike: {
          type: "single",
          damage: 25,
          cooldown: 12000,
          description: "Delivers a powerful strike dealing 25 damage",
        },
      },
    },

    // SLIME DEN MONSTERS
    {
      name: "Blue Slime",
      type: "TANK",
      baseHealth: 40,
      baseAttack: 6,
      baseDefense: 8,
      attackSpeed: 0.8,
      rarity: "COMMON",
      description: "A basic blue slime with low stats but decent defense.",
    },
    {
      name: "Green Slime",
      type: "HEALER",
      baseHealth: 35,
      baseAttack: 5,
      baseDefense: 6,
      attackSpeed: 1.0,
      rarity: "COMMON",
      description: "A green slime that can heal other slimes.",
      abilities: {
        heal: {
          type: "heal",
          target: "ally",
          amount: 15,
          cooldown: 12000,
          description: "Heals a random ally slime for 15 HP",
        },
      },
    },
    {
      name: "Red Slime",
      type: "BERSERKER",
      baseHealth: 55,
      baseAttack: 14,
      baseDefense: 2,
      attackSpeed: 1.3,
      rarity: "ELITE",
      description: "An aggressive red slime with explosive attacks.",
      abilities: {
        explosive: {
          type: "aoe",
          damage: 12,
          cooldown: 15000,
          description: "Explodes dealing 12 damage to all enemies",
        },
      },
    },
    {
      name: "Slime King",
      type: "TANK",
      baseHealth: 200,
      baseAttack: 8,
      baseDefense: 15,
      attackSpeed: 0.6,
      rarity: "BOSS",
      description: "A massive slime king with incredible health and defense.",
      abilities: {
        slimeSpawn: {
          type: "summon",
          cooldown: 20000,
          description: "Spawns 2 Blue Slimes to aid in battle",
        },
        slimeArmor: {
          type: "buff",
          effect: "defense_boost",
          amount: 1.5,
          duration: 10000,
          cooldown: 25000,
          description: "Increases defense by 50% for 10 seconds",
        },
      },
    },

    // WOLF PACK MONSTERS
    {
      name: "Young Wolf",
      type: "RANGER",
      baseHealth: 45,
      baseAttack: 11,
      baseDefense: 3,
      attackSpeed: 1.4,
      rarity: "COMMON",
      description: "A young wolf with fast attacks but low health.",
    },
    {
      name: "Dire Wolf",
      type: "WARRIOR",
      baseHealth: 80,
      baseAttack: 14,
      baseDefense: 7,
      attackSpeed: 1.1,
      rarity: "COMMON",
      description: "A large, strong wolf with balanced combat abilities.",
    },
    {
      name: "Alpha Wolf",
      type: "BERSERKER",
      baseHealth: 100,
      baseAttack: 20,
      baseDefense: 4,
      attackSpeed: 1.2,
      rarity: "ELITE",
      description: "The leader of a wolf pack with high damage potential.",
      abilities: {
        packHowl: {
          type: "buff",
          effect: "speed_boost",
          amount: 1.4,
          duration: 8000,
          cooldown: 18000,
          description: "Howls to increase pack attack speed by 40%",
        },
      },
    },
    {
      name: "Werewolf",
      type: "BERSERKER",
      baseHealth: 150,
      baseAttack: 25,
      baseDefense: 6,
      attackSpeed: 1.0,
      rarity: "BOSS",
      description: "A powerful werewolf with devastating attacks.",
      abilities: {
        berserkerRage: {
          type: "buff",
          effect: "damage_boost",
          amount: 1.6,
          duration: 12000,
          cooldown: 25000,
          description: "Enters berserker rage, increasing damage by 60%",
        },
        clawSwipe: {
          type: "aoe",
          damage: 18,
          cooldown: 10000,
          description: "Swipes with claws dealing 18 damage to all enemies",
        },
      },
    },

    // HAUNTED FOREST MONSTERS
    {
      name: "Lost Spirit",
      type: "MAGE",
      baseHealth: 40,
      baseAttack: 16,
      baseDefense: 1,
      attackSpeed: 1.1,
      rarity: "COMMON",
      description: "A wandering spirit with ethereal magic attacks.",
    },
    {
      name: "Wraith",
      type: "RANGER",
      baseHealth: 60,
      baseAttack: 18,
      baseDefense: 2,
      attackSpeed: 1.5,
      rarity: "ELITE",
      description: "A fast-moving ghost with quick attacks.",
      abilities: {
        phase: {
          type: "buff",
          effect: "dodge_boost",
          amount: 0.3,
          duration: 5000,
          cooldown: 15000,
          description: "Becomes ethereal, gaining 30% dodge chance",
        },
      },
    },
    {
      name: "Poltergeist",
      type: "MAGE",
      baseHealth: 70,
      baseAttack: 22,
      baseDefense: 1,
      attackSpeed: 1.0,
      rarity: "ELITE",
      description: "A chaotic spirit with unpredictable magic.",
      abilities: {
        chaosBolt: {
          type: "single",
          damage: 20,
          cooldown: 8000,
          description: "Fires a chaotic bolt dealing 20 damage",
        },
      },
    },
    {
      name: "Banshee",
      type: "MAGE",
      baseHealth: 120,
      baseAttack: 28,
      baseDefense: 3,
      attackSpeed: 0.9,
      rarity: "BOSS",
      description: "A powerful spirit with devastating scream attacks.",
      abilities: {
        wail: {
          type: "aoe",
          damage: 25,
          cooldown: 12000,
          description:
            "Lets out a devastating wail dealing 25 damage to all enemies",
        },
        fear: {
          type: "debuff",
          effect: "damage_reduction",
          amount: 0.7,
          duration: 10000,
          cooldown: 20000,
          description: "Terrifies enemies, reducing their damage by 30%",
        },
      },
    },

    // ABANDONED MINE MONSTERS
    {
      name: "Cave Spider",
      type: "RANGER",
      baseHealth: 35,
      baseAttack: 13,
      baseDefense: 2,
      attackSpeed: 1.3,
      rarity: "COMMON",
      description: "A venomous spider that lurks in the mine tunnels.",
      abilities: {
        venom: {
          type: "dot",
          damage: 3,
          duration: 8000,
          cooldown: 10000,
          description:
            "Poisons target dealing 3 damage per second for 8 seconds",
        },
      },
    },
    {
      name: "Corrupted Miner",
      type: "WARRIOR",
      baseHealth: 70,
      baseAttack: 12,
      baseDefense: 8,
      attackSpeed: 0.9,
      rarity: "COMMON",
      description: "A former miner corrupted by dark forces.",
    },
    {
      name: "Dark Dweller",
      type: "BERSERKER",
      baseHealth: 90,
      baseAttack: 19,
      baseDefense: 3,
      attackSpeed: 1.2,
      rarity: "ELITE",
      description: "A creature that lurks in the deepest parts of the mine.",
      abilities: {
        ambush: {
          type: "single",
          damage: 22,
          cooldown: 12000,
          description: "Ambushes from the shadows dealing 22 damage",
        },
      },
    },
    {
      name: "Mine Horror",
      type: "TANK",
      baseHealth: 180,
      baseAttack: 15,
      baseDefense: 18,
      attackSpeed: 0.7,
      rarity: "BOSS",
      description: "An ancient terror that haunts the abandoned mine.",
      abilities: {
        caveIn: {
          type: "aoe",
          damage: 20,
          cooldown: 15000,
          description: "Causes a cave-in dealing 20 damage to all enemies",
        },
        stoneSkin: {
          type: "buff",
          effect: "defense_boost",
          amount: 2.0,
          duration: 12000,
          cooldown: 25000,
          description: "Hardens skin, doubling defense for 12 seconds",
        },
      },
    },

    // ADDITIONAL GOBLIN CAVE MONSTERS
    {
      name: "Goblin Rogue",
      type: "RANGER",
      baseHealth: 45,
      baseAttack: 13,
      baseDefense: 3,
      attackSpeed: 1.4,
      rarity: "COMMON",
      description: "A sneaky goblin rogue with quick, precise attacks.",
      abilities: {
        sneak: {
          type: "buff",
          effect: "dodge_boost",
          amount: 0.25,
          duration: 6000,
          cooldown: 12000,
          description: "Becomes harder to hit, gaining 25% dodge chance",
        },
      },
    },
    {
      name: "Hobgoblin",
      type: "WARRIOR",
      baseHealth: 100,
      baseAttack: 16,
      baseDefense: 10,
      attackSpeed: 0.9,
      rarity: "ELITE",
      description: "A larger, more disciplined goblin variant.",
    },
    {
      name: "Goblin Warlord",
      type: "WARRIOR",
      baseHealth: 140,
      baseAttack: 18,
      baseDefense: 12,
      attackSpeed: 0.8,
      rarity: "BOSS",
      description: "The tactical leader of the goblin forces.",
      abilities: {
        battleCommand: {
          type: "buff",
          effect: "damage_boost",
          amount: 1.4,
          duration: 10000,
          cooldown: 20000,
          description: "Commands goblin forces, increasing their damage by 40%",
        },
        tacticalStrike: {
          type: "single",
          damage: 24,
          cooldown: 10000,
          description: "Executes a tactical strike dealing 24 damage",
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
