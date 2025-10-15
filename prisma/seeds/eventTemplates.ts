import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting event templates seed...");

  // Combat Event Templates
  const combatTemplates = [
    {
      type: "COMBAT",
      name: "Goblin Ambush",
      description:
        "A group of goblins has set up an ambush in the narrow passage.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["cave", "forest", "dungeon"],
        enemyTypes: ["goblin"],
        minEnemies: 2,
        maxEnemies: 4,
        // New monster template system - will be populated dynamically
        monsterTemplateIds: [], // Goblin Warrior, Goblin Archer
        minMonsters: 2,
        maxMonsters: 4,
        eliteChance: 0.2, // 20% chance for elite
        specialAbilityChance: 0.1, // 10% chance for special abilities
      },
      outcomes: {
        victory: { experience: 20, gold: 30 },
        defeat: { experience: 5, gold: 0 },
        flee: { experience: 10, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Skeleton Warriors",
      description:
        "Ancient skeletons rise from their graves to defend their tomb.",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 150,
        environments: ["tomb", "crypt", "ruins"],
        enemyTypes: ["skeleton"],
        minEnemies: 3,
        maxEnemies: 5,
        // New monster template system - will be populated dynamically
        monsterTemplateIds: [], // Knight, Bandit Scout, Dark Mage
        minMonsters: 3,
        maxMonsters: 5,
        eliteChance: 0.25, // 25% chance for elite
        specialAbilityChance: 0.15, // 15% chance for special abilities
      },
      outcomes: {
        victory: { experience: 40, gold: 60 },
        defeat: { experience: 10, gold: 0 },
        flee: { experience: 20, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Bandit Raid",
      description: "Desperate bandits block your path, demanding tribute.",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["road", "forest", "mountain"],
        enemyTypes: ["bandit"],
        minEnemies: 2,
        maxEnemies: 4,
        // New monster template system
        monsterTemplateIds: [], // Bandit Scout - will be populated dynamically
        minMonsters: 2,
        maxMonsters: 4,
        eliteChance: 0.15, // 15% chance for elite bandits
        specialAbilityChance: 0.05, // 5% chance for special abilities
      },
      outcomes: {
        victory: { experience: 35, gold: 80 },
        defeat: { experience: 10, gold: 0 },
        flee: { experience: 15, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Demon Encounter",
      description:
        "A powerful demon blocks your path, its eyes glowing with malevolence.",
      difficulty: 4,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 200,
        environments: ["hell", "abyss", "corrupted"],
        enemyTypes: ["demon"],
        minEnemies: 1,
        maxEnemies: 2,
        // New monster template system - will be populated dynamically
        monsterTemplateIds: [], // Warlock, Rage Demon, Lich King
        minMonsters: 1,
        maxMonsters: 2,
        eliteChance: 0.4, // 40% chance for elite demons
        specialAbilityChance: 0.3, // 30% chance for special abilities
      },
      outcomes: {
        victory: { experience: 100, gold: 200 },
        defeat: { experience: 20, gold: 0 },
        flee: { experience: 30, gold: 0 },
      },
    },
    // Training Ground Combat Events
    {
      type: "COMBAT",
      name: "Dummy Practice",
      description: "Practice your combat skills on training dummies.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["training_ground"],
        enemyTypes: ["training_dummy"],
        monsterTemplateIds: ["cmgo9dozm000oumwoxptie3rm"], // Training Dummy
        minMonsters: 1,
        maxMonsters: 2,
        eliteChance: 0,
        specialAbilityChance: 0,
      },
      outcomes: {
        victory: { experience: 5, gold: 10 },
        defeat: { experience: 1, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Advanced Practice",
      description: "Face multiple training dummies at once.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["training_ground"],
        enemyTypes: ["training_dummy", "advanced_training_dummy"],
        monsterTemplateIds: [
          "cmgo9dozm000oumwoxptie3rm",
          "cmgo9dozs000pumwom5ipal48",
        ], // Training Dummy, Advanced Training Dummy
        minMonsters: 2,
        maxMonsters: 3,
        eliteChance: 0,
        specialAbilityChance: 0,
      },
      outcomes: {
        victory: { experience: 8, gold: 15 },
        defeat: { experience: 2, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Sparring Session",
      description: "Practice your combat skills with a sparring partner.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["training_ground"],
        enemyTypes: ["sparring_partner"],
        monsterTemplateIds: [], // Sparring Partner - will be populated dynamically
        minMonsters: 1,
        maxMonsters: 2,
        eliteChance: 0,
        specialAbilityChance: 0.1,
      },
      outcomes: {
        victory: { experience: 10, gold: 20 },
        defeat: { experience: 2, gold: 0 },
      },
    },
    // Boss event (spawns at end for CLEAR missions)
    {
      type: "COMBAT",
      name: "Master Dummy Challenge",
      description:
        "Face the ultimate training challenge - the Master Training Dummy!",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 180,
        environments: ["training_ground"],
        enemyTypes: ["master_training_dummy"],
        monsterTemplateIds: ["cmgo9dozx000qumwojwn8r0nk"], // Master Training Dummy
        isBossFight: true,
        minMonsters: 1,
        maxMonsters: 1,
        eliteChance: 0,
        specialAbilityChance: 0.3,
      },
      outcomes: {
        victory: { experience: 15, gold: 50 },
        defeat: { experience: 3, gold: 0 },
      },
    },

    // BANDIT CAMP EVENTS (Difficulty 1)
    {
      type: "COMBAT",
      name: "Bandit Patrol",
      description:
        "A small patrol of bandits blocks your path through the camp.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 90,
        environments: ["road", "forest", "camp"],
        enemyTypes: ["bandit"],
        minEnemies: 2,
        maxEnemies: 3,
        monsterTemplateIds: [], // Will be populated dynamically
        minMonsters: 2,
        maxMonsters: 3,
        eliteChance: 0,
        specialAbilityChance: 0,
      },
      outcomes: {
        victory: { experience: 25, gold: 60 },
        defeat: { experience: 8, gold: 0 },
        flee: { experience: 12, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Bandit Ambush",
      description: "Bandits spring an ambush from the surrounding trees!",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 100,
        environments: ["forest", "road"],
        enemyTypes: ["bandit"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.1,
        specialAbilityChance: 0.05,
      },
      outcomes: {
        victory: { experience: 30, gold: 80 },
        defeat: { experience: 10, gold: 0 },
        flee: { experience: 15, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Enforcer Encounter",
      description: "A dangerous bandit enforcer challenges you to combat!",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 110,
        environments: ["camp", "road"],
        enemyTypes: ["bandit"],
        minEnemies: 2,
        maxEnemies: 3,
        monsterTemplateIds: [],
        minMonsters: 2,
        maxMonsters: 3,
        eliteChance: 0.5,
        specialAbilityChance: 0.1,
      },
      outcomes: {
        victory: { experience: 35, gold: 100 },
        defeat: { experience: 12, gold: 0 },
        flee: { experience: 18, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Camp Guard",
      description:
        "The bandit camp's guards stand ready to defend their territory.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["camp"],
        enemyTypes: ["bandit"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 0.2,
        specialAbilityChance: 0.05,
      },
      outcomes: {
        victory: { experience: 40, gold: 120 },
        defeat: { experience: 15, gold: 0 },
        flee: { experience: 20, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Bandit Captain",
      description:
        "The Bandit Captain emerges to personally deal with the intruders!",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 150,
        environments: ["camp"],
        enemyTypes: ["bandit"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 1.0, // Always spawns the boss
        specialAbilityChance: 0.3,
      },
      outcomes: {
        victory: { experience: 60, gold: 200 },
        defeat: { experience: 20, gold: 0 },
        flee: { experience: 30, gold: 0 },
      },
    },

    // SLIME DEN EVENTS (Difficulty 1)
    {
      type: "COMBAT",
      name: "Slime Cluster",
      description: "A cluster of blue slimes blocks your path through the den.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 80,
        environments: ["cave", "den"],
        enemyTypes: ["slime"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0,
        specialAbilityChance: 0,
      },
      outcomes: {
        victory: { experience: 20, gold: 40 },
        defeat: { experience: 6, gold: 0 },
        flee: { experience: 10, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Slime Variety",
      description:
        "Different colored slimes have gathered in this area of the den.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 100,
        environments: ["cave", "den"],
        enemyTypes: ["slime"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 0.25,
        specialAbilityChance: 0.1,
      },
      outcomes: {
        victory: { experience: 30, gold: 60 },
        defeat: { experience: 10, gold: 0 },
        flee: { experience: 15, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Healing Slimes",
      description:
        "Green slimes with healing abilities guard this section of the den.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 110,
        environments: ["cave", "den"],
        enemyTypes: ["slime"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 0.1,
        specialAbilityChance: 0.2,
      },
      outcomes: {
        victory: { experience: 35, gold: 70 },
        defeat: { experience: 12, gold: 0 },
        flee: { experience: 18, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Elite Slime",
      description:
        "A dangerous red slime with explosive abilities blocks your way!",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["cave", "den"],
        enemyTypes: ["slime"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.5,
        specialAbilityChance: 0.3,
      },
      outcomes: {
        victory: { experience: 40, gold: 80 },
        defeat: { experience: 15, gold: 0 },
        flee: { experience: 20, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Slime King",
      description: "The massive Slime King emerges from the depths of the den!",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 150,
        environments: ["cave", "den"],
        enemyTypes: ["slime"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 1.0, // Always spawns the boss
        specialAbilityChance: 0.4,
      },
      outcomes: {
        victory: { experience: 60, gold: 150 },
        defeat: { experience: 20, gold: 0 },
        flee: { experience: 30, gold: 0 },
      },
    },

    // GOBLIN CAVE EVENTS (Difficulty 2)
    {
      type: "COMBAT",
      name: "Goblin Raiders",
      description: "A group of goblin raiders attacks from the cave shadows!",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 100,
        environments: ["cave", "tunnel"],
        enemyTypes: ["goblin"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.1,
        specialAbilityChance: 0.05,
      },
      outcomes: {
        victory: { experience: 40, gold: 80 },
        defeat: { experience: 12, gold: 0 },
        flee: { experience: 20, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Goblin Ambush",
      description: "Sneaky goblin rogues ambush you from the cave walls!",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 110,
        environments: ["cave", "tunnel"],
        enemyTypes: ["goblin"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 0.2,
        specialAbilityChance: 0.1,
      },
      outcomes: {
        victory: { experience: 50, gold: 100 },
        defeat: { experience: 15, gold: 0 },
        flee: { experience: 25, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Goblin War Party",
      description:
        "A full goblin war party with shaman support blocks your path!",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 130,
        environments: ["cave", "chamber"],
        enemyTypes: ["goblin"],
        minEnemies: 5,
        maxEnemies: 6,
        monsterTemplateIds: [],
        minMonsters: 5,
        maxMonsters: 6,
        eliteChance: 0.2,
        specialAbilityChance: 0.15,
      },
      outcomes: {
        victory: { experience: 60, gold: 120 },
        defeat: { experience: 18, gold: 0 },
        flee: { experience: 30, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Hobgoblin Squad",
      description:
        "A disciplined squad of hobgoblins guards this area of the cave.",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["cave", "chamber"],
        enemyTypes: ["goblin"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.6,
        specialAbilityChance: 0.1,
      },
      outcomes: {
        victory: { experience: 55, gold: 110 },
        defeat: { experience: 16, gold: 0 },
        flee: { experience: 28, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Goblin Warlord",
      description: "The Goblin Warlord emerges to personally lead the defense!",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 150,
        environments: ["cave", "chamber"],
        enemyTypes: ["goblin"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 1.0, // Always spawns the boss
        specialAbilityChance: 0.3,
      },
      outcomes: {
        victory: { experience: 80, gold: 200 },
        defeat: { experience: 25, gold: 0 },
        flee: { experience: 40, gold: 0 },
      },
    },

    // WOLF PACK EVENTS (Difficulty 2)
    {
      type: "COMBAT",
      name: "Young Pack",
      description:
        "A pack of young wolves circles around you, testing your resolve.",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 90,
        environments: ["forest", "clearing"],
        enemyTypes: ["wolf"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0,
        specialAbilityChance: 0,
      },
      outcomes: {
        victory: { experience: 35, gold: 70 },
        defeat: { experience: 10, gold: 0 },
        flee: { experience: 18, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Dire Wolves",
      description: "Large dire wolves emerge from the forest shadows!",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 110,
        environments: ["forest", "clearing"],
        enemyTypes: ["wolf"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.2,
        specialAbilityChance: 0.05,
      },
      outcomes: {
        victory: { experience: 45, gold: 90 },
        defeat: { experience: 14, gold: 0 },
        flee: { experience: 23, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Alpha's Pack",
      description: "An alpha wolf leads its pack in a coordinated attack!",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["forest", "clearing"],
        enemyTypes: ["wolf"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.5,
        specialAbilityChance: 0.15,
      },
      outcomes: {
        victory: { experience: 55, gold: 110 },
        defeat: { experience: 16, gold: 0 },
        flee: { experience: 28, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Mixed Pack",
      description:
        "A mixed pack of wolves with different abilities attacks together!",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 130,
        environments: ["forest", "clearing"],
        enemyTypes: ["wolf"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 0.3,
        specialAbilityChance: 0.1,
      },
      outcomes: {
        victory: { experience: 60, gold: 120 },
        defeat: { experience: 18, gold: 0 },
        flee: { experience: 30, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Werewolf",
      description:
        "A powerful werewolf emerges from the shadows, its eyes glowing with rage!",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 150,
        environments: ["forest", "clearing"],
        enemyTypes: ["wolf"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 1.0, // Always spawns the boss
        specialAbilityChance: 0.4,
      },
      outcomes: {
        victory: { experience: 80, gold: 180 },
        defeat: { experience: 25, gold: 0 },
        flee: { experience: 40, gold: 0 },
      },
    },

    // HAUNTED FOREST EVENTS (Difficulty 3)
    {
      type: "COMBAT",
      name: "Wandering Spirits",
      description:
        "Lost spirits drift through the haunted forest, drawn to your life force.",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 100,
        environments: ["forest", "haunted"],
        enemyTypes: ["spirit"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0,
        specialAbilityChance: 0,
      },
      outcomes: {
        victory: { experience: 50, gold: 100 },
        defeat: { experience: 15, gold: 0 },
        flee: { experience: 25, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Wraith Attack",
      description: "Fast-moving wraiths phase through the trees to attack!",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["forest", "haunted"],
        enemyTypes: ["spirit"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.4,
        specialAbilityChance: 0.2,
      },
      outcomes: {
        victory: { experience: 65, gold: 130 },
        defeat: { experience: 20, gold: 0 },
        flee: { experience: 33, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Poltergeist Chaos",
      description:
        "A chaotic poltergeist creates havoc with its unpredictable magic!",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 130,
        environments: ["forest", "haunted"],
        enemyTypes: ["spirit"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.5,
        specialAbilityChance: 0.3,
      },
      outcomes: {
        victory: { experience: 70, gold: 140 },
        defeat: { experience: 22, gold: 0 },
        flee: { experience: 35, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Spirit Horde",
      description: "A horde of spirits converges on your location!",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 140,
        environments: ["forest", "haunted"],
        enemyTypes: ["spirit"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 0.3,
        specialAbilityChance: 0.15,
      },
      outcomes: {
        victory: { experience: 75, gold: 150 },
        defeat: { experience: 25, gold: 0 },
        flee: { experience: 38, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Banshee",
      description:
        "A terrifying banshee's wail echoes through the haunted forest!",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 150,
        environments: ["forest", "haunted"],
        enemyTypes: ["spirit"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 1.0, // Always spawns the boss
        specialAbilityChance: 0.4,
      },
      outcomes: {
        victory: { experience: 100, gold: 250 },
        defeat: { experience: 30, gold: 0 },
        flee: { experience: 50, gold: 0 },
      },
    },

    // ABANDONED MINE EVENTS (Difficulty 3)
    {
      type: "COMBAT",
      name: "Spider Nest",
      description: "Venomous cave spiders have made their nest in this tunnel!",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 100,
        environments: ["cave", "mine"],
        enemyTypes: ["spider", "miner"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0,
        specialAbilityChance: 0.1,
      },
      outcomes: {
        victory: { experience: 50, gold: 100 },
        defeat: { experience: 15, gold: 0 },
        flee: { experience: 25, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Corrupted Workers",
      description: "The spirits of corrupted miners still haunt these tunnels!",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 110,
        environments: ["cave", "mine"],
        enemyTypes: ["miner"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.1,
        specialAbilityChance: 0.05,
      },
      outcomes: {
        victory: { experience: 55, gold: 110 },
        defeat: { experience: 16, gold: 0 },
        flee: { experience: 28, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Dark Ambush",
      description:
        "Dark dwellers ambush you from the deepest shadows of the mine!",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 120,
        environments: ["cave", "mine"],
        enemyTypes: ["spider", "dweller"],
        minEnemies: 3,
        maxEnemies: 4,
        monsterTemplateIds: [],
        minMonsters: 3,
        maxMonsters: 4,
        eliteChance: 0.4,
        specialAbilityChance: 0.2,
      },
      outcomes: {
        victory: { experience: 65, gold: 130 },
        defeat: { experience: 20, gold: 0 },
        flee: { experience: 33, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Mine Patrol",
      description: "A mixed patrol of mine creatures guards this section!",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 130,
        environments: ["cave", "mine"],
        enemyTypes: ["spider", "miner"],
        minEnemies: 4,
        maxEnemies: 5,
        monsterTemplateIds: [],
        minMonsters: 4,
        maxMonsters: 5,
        eliteChance: 0.2,
        specialAbilityChance: 0.1,
      },
      outcomes: {
        victory: { experience: 70, gold: 140 },
        defeat: { experience: 22, gold: 0 },
        flee: { experience: 35, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Mine Horror",
      description:
        "An ancient horror emerges from the deepest depths of the mine!",
      difficulty: 3,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 150,
        environments: ["cave", "mine"],
        enemyTypes: ["spider", "miner", "dweller"],
        minEnemies: 5,
        maxEnemies: 6,
        monsterTemplateIds: [],
        minMonsters: 5,
        maxMonsters: 6,
        eliteChance: 1.0, // Always spawns the boss
        specialAbilityChance: 0.3,
      },
      outcomes: {
        victory: { experience: 100, gold: 250 },
        defeat: { experience: 30, gold: 0 },
        flee: { experience: 50, gold: 0 },
      },
    },
  ];

  // Treasure Event Templates
  const treasureTemplates = [
    {
      type: "TREASURE",
      name: "Hidden Cache",
      description: "You discover a hidden cache of valuables.",
      difficulty: 1,
      minigameType: "LOCK_PICKING",
      config: {
        timeLimit: 60,
        trapChance: 0.2,
        treasureTypes: ["gold", "gems"],
        lockDifficulty: 1,
      },
      outcomes: {
        success: { gold: 50, experience: 15 },
        trapped: { gold: 25, experience: 10, damage: 10 },
        failure: { gold: 0, experience: 5 },
      },
    },
    {
      type: "TREASURE",
      name: "Ancient Chest",
      description:
        "An ornate chest sits in the corner, covered in dust and cobwebs.",
      difficulty: 2,
      minigameType: "LOCK_PICKING",
      config: {
        timeLimit: 90,
        trapChance: 0.4,
        treasureTypes: ["gold", "gems", "artifacts"],
        lockDifficulty: 3,
      },
      outcomes: {
        success: { gold: 100, experience: 25, items: ["health_potion"] },
        trapped: { gold: 50, experience: 15, damage: 15 },
        failure: { gold: 0, experience: 8 },
      },
    },
    {
      type: "TREASURE",
      name: "Dragon's Hoard",
      description: "A massive pile of gold and gems glitters in the dim light.",
      difficulty: 5,
      minigameType: "NONE",
      config: {
        timeLimit: 120,
        trapChance: 0.8,
        treasureTypes: ["gold", "gems", "artifacts", "legendary_items"],
        dragonPresence: true,
      },
      outcomes: {
        success: { gold: 500, experience: 100, items: ["legendary_sword"] },
        trapped: { gold: 200, experience: 50, damage: 50 },
        failure: { gold: 0, experience: 20 },
      },
    },
  ];

  // Trap Event Templates
  const trapTemplates = [
    {
      type: "TRAP",
      name: "Spike Pit",
      description: "A concealed pit filled with sharp spikes blocks your path.",
      difficulty: 1,
      minigameType: "JUMPING_GAPS",
      config: {
        timeLimit: 90,
        trapType: "spike",
        damage: 15,
        detectionDifficulty: 2,
        jumpDifficulty: 2,
      },
      outcomes: {
        success: { experience: 20, gold: 0 },
        failure: { experience: 5, gold: 0, damage: 15 },
      },
    },
    {
      type: "TRAP",
      name: "Poison Dart Trap",
      description: "Ancient mechanisms trigger poison darts from the walls.",
      difficulty: 2,
      minigameType: "QUICK_TIME",
      config: {
        timeLimit: 60,
        trapType: "poison",
        damage: 20,
        detectionDifficulty: 3,
        reactionTime: 1.5,
      },
      outcomes: {
        success: { experience: 30, gold: 0 },
        failure: { experience: 8, gold: 0, damage: 20, poison: true },
      },
    },
    {
      type: "TRAP",
      name: "Closing Walls",
      description: "The walls begin to close in, threatening to crush you!",
      difficulty: 3,
      minigameType: "CLOSING_WALLS",
      config: {
        timeLimit: 120,
        trapType: "crushing",
        damage: 40,
        detectionDifficulty: 1,
        escapeDifficulty: 4,
      },
      outcomes: {
        success: { experience: 50, gold: 0 },
        failure: { experience: 10, gold: 0, damage: 40 },
      },
    },
  ];

  // Puzzle Event Templates
  const puzzleTemplates = [
    {
      type: "PUZZLE",
      name: "Ancient Riddle",
      description:
        "An inscription on the wall presents a riddle that must be solved.",
      difficulty: 2,
      minigameType: "RIDDLE",
      config: {
        timeLimit: 180,
        puzzleType: "riddle",
        hints: 2,
        complexity: 3,
      },
      outcomes: {
        success: { experience: 40, gold: 75 },
        failure: { experience: 10, gold: 0 },
      },
    },
    {
      type: "PUZZLE",
      name: "Pattern Lock",
      description: "A complex pattern must be matched to unlock the door.",
      difficulty: 3,
      minigameType: "LOCK_PICKING",
      config: {
        timeLimit: 150,
        puzzleType: "pattern",
        hints: 1,
        complexity: 4,
      },
      outcomes: {
        success: { experience: 60, gold: 100 },
        failure: { experience: 15, gold: 0 },
      },
    },
  ];

  // Choice Event Templates
  const choiceTemplates = [
    {
      type: "CHOICE",
      name: "Injured Traveler",
      description: "You find an injured traveler on the path. They need help.",
      difficulty: 1,
      minigameType: "NONE",
      config: {
        timeLimit: 120,
        scenario: "injured_traveler",
        options: [
          { id: "help", text: "Help them", consequence: "positive" },
          { id: "ignore", text: "Ignore them", consequence: "neutral" },
          { id: "rob", text: "Rob them", consequence: "negative" },
        ],
      },
      outcomes: {
        help: { reputation: 10, gold: 20, experience: 25 },
        ignore: { reputation: 0, gold: 0, experience: 10 },
        rob: { reputation: -10, gold: 50, experience: 15 },
      },
    },
    {
      type: "CHOICE",
      name: "Moral Dilemma",
      description:
        "You must choose between saving a village or pursuing the villain.",
      difficulty: 3,
      minigameType: "NONE",
      config: {
        timeLimit: 150,
        scenario: "moral_dilemma",
        options: [
          { id: "save", text: "Save the village", consequence: "heroic" },
          {
            id: "pursue",
            text: "Pursue the villain",
            consequence: "pragmatic",
          },
          { id: "both", text: "Try to do both", consequence: "risky" },
        ],
      },
      outcomes: {
        save: { reputation: 20, gold: 100, experience: 50 },
        pursue: { reputation: 5, gold: 200, experience: 75 },
        both: { reputation: 15, gold: 150, experience: 100, risk: 0.5 },
      },
    },
  ];

  // Boss Event Templates
  const bossTemplates = [
    {
      type: "COMBAT",
      name: "Master Training Dummy Challenge",
      description:
        "The ultimate training challenge awaits! The Master Training Dummy stands ready to test your combat skills.",
      difficulty: 1,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 180,
        bossType: "master_dummy",
        phases: 1,
        specialAbilities: ["counter_attack"],
        isBossFight: true,
        // New monster template system - will be linked by name
        monsterTemplateIds: [], // Will be populated dynamically
        minMonsters: 1,
        maxMonsters: 1,
        eliteChance: 0, // Boss is already elite
        specialAbilityChance: 1.0, // Boss always has special abilities
      },
      outcomes: {
        victory: { experience: 50, gold: 100, items: ["training_certificate"] },
        defeat: { experience: 10, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Goblin Chief",
      description:
        "The goblin chief stands before you, wielding a crude but deadly weapon.",
      difficulty: 2,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 300,
        bossType: "goblin_chief",
        phases: 2,
        specialAbilities: ["charge", "summon"],
        isBossFight: true,
        // New monster template system
        monsterTemplateIds: [], // Will be populated dynamically
        minMonsters: 1,
        maxMonsters: 1,
        eliteChance: 0, // Boss is already elite
        specialAbilityChance: 1.0, // Boss always has special abilities
      },
      outcomes: {
        victory: { experience: 100, gold: 200, items: ["chiefs_weapon"] },
        defeat: { experience: 25, gold: 0 },
      },
    },
    {
      type: "COMBAT",
      name: "Dragon Lord",
      description:
        "An ancient dragon blocks your path, its scales gleaming like precious metals.",
      difficulty: 5,
      minigameType: "COMBAT_CLICKER",
      config: {
        timeLimit: 600,
        bossType: "dragon",
        phases: 3,
        specialAbilities: ["fire_breath", "fly", "summon", "heal"],
        isBossFight: true,
        // New monster template system
        monsterTemplateIds: [], // Will be populated dynamically
        minMonsters: 1,
        maxMonsters: 1,
        eliteChance: 0, // Boss is already elite
        specialAbilityChance: 1.0, // Boss always has special abilities
      },
      outcomes: {
        victory: { experience: 500, gold: 1000, items: ["dragon_scale_armor"] },
        defeat: { experience: 100, gold: 0 },
      },
    },
  ];

  // NPC Encounter Templates
  const npcTemplates = [
    {
      type: "NPC_ENCOUNTER",
      name: "Mysterious Merchant",
      description: "A hooded figure offers to trade with you.",
      difficulty: 1,
      minigameType: "NONE",
      config: {
        timeLimit: 90,
        npcType: "merchant",
        disposition: "neutral",
        hasQuest: true,
      },
      outcomes: {
        trade: { gold: -50, items: ["health_potion", "mana_potion"] },
        quest: { experience: 30, gold: 75, quest: "delivery" },
        ignore: { experience: 5, gold: 0 },
      },
    },
    {
      type: "NPC_ENCOUNTER",
      name: "Wise Wizard",
      description:
        "An elderly wizard offers knowledge in exchange for a favor.",
      difficulty: 3,
      minigameType: "NONE",
      config: {
        timeLimit: 120,
        npcType: "wizard",
        disposition: "friendly",
        hasQuest: true,
      },
      outcomes: {
        help: { experience: 80, gold: 100, knowledge: "spell_scroll" },
        refuse: { experience: 20, gold: 0 },
      },
    },
  ];

  // Rest Event Templates
  const restTemplates = [
    {
      type: "REST",
      name: "Safe Haven",
      description:
        "You find a peaceful clearing where you can rest and recover.",
      difficulty: 0,
      minigameType: "NONE",
      config: {
        timeLimit: 60,
        environments: ["forest", "cave", "ruins"],
        healingAmount: 50, // Heal 50% of max health
        description: "A quiet spot to rest and recover strength.",
      },
      outcomes: {
        rest: { experience: 5, gold: 0 },
      },
    },
    {
      type: "REST",
      name: "Ancient Shrine",
      description:
        "An ancient shrine radiates healing energy, offering respite from your journey.",
      difficulty: 0,
      minigameType: "NONE",
      config: {
        timeLimit: 90,
        environments: ["temple", "ruins", "sacred"],
        healingAmount: 75, // Heal 75% of max health
        description: "The shrine's divine energy restores your vitality.",
      },
      outcomes: {
        rest: { experience: 10, gold: 0 },
      },
    },
    {
      type: "REST",
      name: "Healing Spring",
      description: "A magical spring bubbles with restorative waters.",
      difficulty: 0,
      minigameType: "NONE",
      config: {
        timeLimit: 120,
        environments: ["forest", "mountain", "magical"],
        healingAmount: 100, // Full heal
        description: "The spring's magical waters fully restore your health.",
      },
      outcomes: {
        rest: { experience: 15, gold: 0 },
      },
    },
  ];

  // Environmental Hazard Templates
  const hazardTemplates = [
    {
      type: "ENVIRONMENTAL_HAZARD",
      name: "Falling Rocks",
      description:
        "The ceiling begins to crumble, rocks falling all around you.",
      difficulty: 2,
      minigameType: "QUICK_TIME",
      config: {
        timeLimit: 60,
        hazardType: "falling_rocks",
        damage: 25,
        avoidanceDifficulty: 3,
      },
      outcomes: {
        success: { experience: 30, gold: 0 },
        failure: { experience: 8, gold: 0, damage: 25 },
      },
    },
    {
      type: "ENVIRONMENTAL_HAZARD",
      name: "Poisonous Gas",
      description: "Toxic gas seeps from cracks in the walls.",
      difficulty: 3,
      minigameType: "CLOSING_WALLS",
      config: {
        timeLimit: 90,
        hazardType: "poison_gas",
        damage: 15,
        duration: 30,
        avoidanceDifficulty: 4,
      },
      outcomes: {
        success: { experience: 40, gold: 0 },
        failure: { experience: 10, gold: 0, damage: 15, poison: true },
      },
    },
  ];

  // Combine all templates
  const allTemplates = [
    ...combatTemplates,
    ...treasureTemplates,
    ...trapTemplates,
    ...puzzleTemplates,
    ...choiceTemplates,
    ...restTemplates,
    ...bossTemplates,
    ...npcTemplates,
    ...hazardTemplates,
  ];

  console.log("📝 Creating event templates...");
  for (const template of allTemplates) {
    const existing = await prisma.eventTemplate.findFirst({
      where: { name: template.name },
    });

    // Populate monster template IDs dynamically based on template name
    const templateData = { ...template };

    if (template.name === "Goblin Ambush") {
      const goblinWarrior = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Warrior" },
      });
      const goblinArcher = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Archer" },
      });
      const ids = [];
      if (goblinWarrior) ids.push(goblinWarrior.id);
      if (goblinArcher) ids.push(goblinArcher.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Skeleton Warriors") {
      const knight = await prisma.monsterTemplate.findFirst({
        where: { name: "Knight" },
      });
      const banditScout = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Scout" },
      });
      const darkMage = await prisma.monsterTemplate.findFirst({
        where: { name: "Dark Mage" },
      });
      const ids = [];
      if (knight) ids.push(knight.id);
      if (banditScout) ids.push(banditScout.id);
      if (darkMage) ids.push(darkMage.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Bandit Raid") {
      const banditScout = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Scout" },
      });
      if (banditScout && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [banditScout.id];
      }
    } else if (template.name === "Demon Encounter") {
      const warlock = await prisma.monsterTemplate.findFirst({
        where: { name: "Warlock" },
      });
      const rageDemon = await prisma.monsterTemplate.findFirst({
        where: { name: "Rage Demon" },
      });
      const lichKing = await prisma.monsterTemplate.findFirst({
        where: { name: "Lich King" },
      });
      const ids = [];
      if (warlock) ids.push(warlock.id);
      if (rageDemon) ids.push(rageDemon.id);
      if (lichKing) ids.push(lichKing.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Sparring Session") {
      const sparringPartner = await prisma.monsterTemplate.findFirst({
        where: { name: "Sparring Partner" },
      });
      if (sparringPartner && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [sparringPartner.id];
      }
    } else if (template.name === "Master Training Dummy Challenge") {
      const masterDummy = await prisma.monsterTemplate.findFirst({
        where: { name: "Master Training Dummy" },
      });
      if (masterDummy && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [masterDummy.id];
      }
    } else if (template.name === "Goblin Chief") {
      const orcWarlord = await prisma.monsterTemplate.findFirst({
        where: { name: "Orc Warlord" },
      });
      if (orcWarlord && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [orcWarlord.id];
      }
    } else if (template.name === "Dragon Lord") {
      const dragon = await prisma.monsterTemplate.findFirst({
        where: { name: "Dragon" },
      });
      if (dragon && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [dragon.id];
      }
    }

    // BANDIT CAMP EVENTS
    else if (template.name === "Bandit Patrol") {
      const banditThug = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Thug" },
      });
      if (banditThug && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [banditThug.id];
      }
    } else if (template.name === "Bandit Ambush") {
      const banditThug = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Thug" },
      });
      const banditCrossbowman = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Crossbowman" },
      });
      const ids = [];
      if (banditThug) ids.push(banditThug.id);
      if (banditCrossbowman) ids.push(banditCrossbowman.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Enforcer Encounter") {
      const banditEnforcer = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Enforcer" },
      });
      const banditThug = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Thug" },
      });
      const ids = [];
      if (banditEnforcer) ids.push(banditEnforcer.id);
      if (banditThug) ids.push(banditThug.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Camp Guard") {
      const banditThug = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Thug" },
      });
      const banditCrossbowman = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Crossbowman" },
      });
      const ids = [];
      if (banditThug) ids.push(banditThug.id);
      if (banditCrossbowman) ids.push(banditCrossbowman.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Bandit Captain") {
      const banditCaptain = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Captain" },
      });
      const banditThug = await prisma.monsterTemplate.findFirst({
        where: { name: "Bandit Thug" },
      });
      const ids = [];
      if (banditCaptain) ids.push(banditCaptain.id);
      if (banditThug) ids.push(banditThug.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    }

    // SLIME DEN EVENTS
    else if (template.name === "Slime Cluster") {
      const blueSlime = await prisma.monsterTemplate.findFirst({
        where: { name: "Blue Slime" },
      });
      if (blueSlime && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [blueSlime.id];
      }
    } else if (template.name === "Slime Variety") {
      const blueSlime = await prisma.monsterTemplate.findFirst({
        where: { name: "Blue Slime" },
      });
      const greenSlime = await prisma.monsterTemplate.findFirst({
        where: { name: "Green Slime" },
      });
      const redSlime = await prisma.monsterTemplate.findFirst({
        where: { name: "Red Slime" },
      });
      const ids = [];
      if (blueSlime) ids.push(blueSlime.id);
      if (greenSlime) ids.push(greenSlime.id);
      if (redSlime) ids.push(redSlime.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Healing Slimes") {
      const blueSlime = await prisma.monsterTemplate.findFirst({
        where: { name: "Blue Slime" },
      });
      const greenSlime = await prisma.monsterTemplate.findFirst({
        where: { name: "Green Slime" },
      });
      const ids = [];
      if (blueSlime) ids.push(blueSlime.id);
      if (greenSlime) ids.push(greenSlime.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Elite Slime") {
      const redSlime = await prisma.monsterTemplate.findFirst({
        where: { name: "Red Slime" },
      });
      const blueSlime = await prisma.monsterTemplate.findFirst({
        where: { name: "Blue Slime" },
      });
      const ids = [];
      if (redSlime) ids.push(redSlime.id);
      if (blueSlime) ids.push(blueSlime.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Slime King") {
      const slimeKing = await prisma.monsterTemplate.findFirst({
        where: { name: "Slime King" },
      });
      const blueSlime = await prisma.monsterTemplate.findFirst({
        where: { name: "Blue Slime" },
      });
      const ids = [];
      if (slimeKing) ids.push(slimeKing.id);
      if (blueSlime) ids.push(blueSlime.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    }

    // GOBLIN CAVE EVENTS
    else if (template.name === "Goblin Raiders") {
      const goblinWarrior = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Warrior" },
      });
      const goblinArcher = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Archer" },
      });
      const ids = [];
      if (goblinWarrior) ids.push(goblinWarrior.id);
      if (goblinArcher) ids.push(goblinArcher.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Goblin War Party") {
      const goblinWarrior = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Warrior" },
      });
      const goblinArcher = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Archer" },
      });
      const goblinShaman = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Shaman" },
      });
      const ids = [];
      if (goblinWarrior) ids.push(goblinWarrior.id);
      if (goblinArcher) ids.push(goblinArcher.id);
      if (goblinShaman) ids.push(goblinShaman.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Hobgoblin Squad") {
      const hobgoblin = await prisma.monsterTemplate.findFirst({
        where: { name: "Hobgoblin" },
      });
      const goblinWarrior = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Warrior" },
      });
      const ids = [];
      if (hobgoblin) ids.push(hobgoblin.id);
      if (goblinWarrior) ids.push(goblinWarrior.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Goblin Warlord") {
      const goblinWarlord = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Warlord" },
      });
      const hobgoblin = await prisma.monsterTemplate.findFirst({
        where: { name: "Hobgoblin" },
      });
      const goblinShaman = await prisma.monsterTemplate.findFirst({
        where: { name: "Goblin Shaman" },
      });
      const ids = [];
      if (goblinWarlord) ids.push(goblinWarlord.id);
      if (hobgoblin) ids.push(hobgoblin.id);
      if (goblinShaman) ids.push(goblinShaman.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    }

    // WOLF PACK EVENTS
    else if (template.name === "Young Pack") {
      const youngWolf = await prisma.monsterTemplate.findFirst({
        where: { name: "Young Wolf" },
      });
      if (youngWolf && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [youngWolf.id];
      }
    } else if (template.name === "Dire Wolves") {
      const direWolf = await prisma.monsterTemplate.findFirst({
        where: { name: "Dire Wolf" },
      });
      const youngWolf = await prisma.monsterTemplate.findFirst({
        where: { name: "Young Wolf" },
      });
      const ids = [];
      if (direWolf) ids.push(direWolf.id);
      if (youngWolf) ids.push(youngWolf.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Alpha's Pack") {
      const alphaWolf = await prisma.monsterTemplate.findFirst({
        where: { name: "Alpha Wolf" },
      });
      const direWolf = await prisma.monsterTemplate.findFirst({
        where: { name: "Dire Wolf" },
      });
      const ids = [];
      if (alphaWolf) ids.push(alphaWolf.id);
      if (direWolf) ids.push(direWolf.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Mixed Pack") {
      const direWolf = await prisma.monsterTemplate.findFirst({
        where: { name: "Dire Wolf" },
      });
      const youngWolf = await prisma.monsterTemplate.findFirst({
        where: { name: "Young Wolf" },
      });
      const ids = [];
      if (direWolf) ids.push(direWolf.id);
      if (youngWolf) ids.push(youngWolf.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Werewolf") {
      const werewolf = await prisma.monsterTemplate.findFirst({
        where: { name: "Werewolf" },
      });
      const alphaWolf = await prisma.monsterTemplate.findFirst({
        where: { name: "Alpha Wolf" },
      });
      const ids = [];
      if (werewolf) ids.push(werewolf.id);
      if (alphaWolf) ids.push(alphaWolf.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    }

    // HAUNTED FOREST EVENTS
    else if (template.name === "Wandering Spirits") {
      const lostSpirit = await prisma.monsterTemplate.findFirst({
        where: { name: "Lost Spirit" },
      });
      if (lostSpirit && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [lostSpirit.id];
      }
    } else if (template.name === "Wraith Attack") {
      const wraith = await prisma.monsterTemplate.findFirst({
        where: { name: "Wraith" },
      });
      const lostSpirit = await prisma.monsterTemplate.findFirst({
        where: { name: "Lost Spirit" },
      });
      const ids = [];
      if (wraith) ids.push(wraith.id);
      if (lostSpirit) ids.push(lostSpirit.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Poltergeist Chaos") {
      const poltergeist = await prisma.monsterTemplate.findFirst({
        where: { name: "Poltergeist" },
      });
      const lostSpirit = await prisma.monsterTemplate.findFirst({
        where: { name: "Lost Spirit" },
      });
      const ids = [];
      if (poltergeist) ids.push(poltergeist.id);
      if (lostSpirit) ids.push(lostSpirit.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Spirit Horde") {
      const lostSpirit = await prisma.monsterTemplate.findFirst({
        where: { name: "Lost Spirit" },
      });
      const wraith = await prisma.monsterTemplate.findFirst({
        where: { name: "Wraith" },
      });
      const ids = [];
      if (lostSpirit) ids.push(lostSpirit.id);
      if (wraith) ids.push(wraith.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Banshee") {
      const banshee = await prisma.monsterTemplate.findFirst({
        where: { name: "Banshee" },
      });
      const wraith = await prisma.monsterTemplate.findFirst({
        where: { name: "Wraith" },
      });
      const poltergeist = await prisma.monsterTemplate.findFirst({
        where: { name: "Poltergeist" },
      });
      const ids = [];
      if (banshee) ids.push(banshee.id);
      if (wraith) ids.push(wraith.id);
      if (poltergeist) ids.push(poltergeist.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    }

    // ABANDONED MINE EVENTS
    else if (template.name === "Spider Nest") {
      const caveSpider = await prisma.monsterTemplate.findFirst({
        where: { name: "Cave Spider" },
      });
      if (caveSpider && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [caveSpider.id];
      }
    } else if (template.name === "Corrupted Workers") {
      const corruptedMiner = await prisma.monsterTemplate.findFirst({
        where: { name: "Corrupted Miner" },
      });
      if (corruptedMiner && "monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = [corruptedMiner.id];
      }
    } else if (template.name === "Dark Ambush") {
      const caveSpider = await prisma.monsterTemplate.findFirst({
        where: { name: "Cave Spider" },
      });
      const darkDweller = await prisma.monsterTemplate.findFirst({
        where: { name: "Dark Dweller" },
      });
      const ids = [];
      if (caveSpider) ids.push(caveSpider.id);
      if (darkDweller) ids.push(darkDweller.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Mine Patrol") {
      const caveSpider = await prisma.monsterTemplate.findFirst({
        where: { name: "Cave Spider" },
      });
      const corruptedMiner = await prisma.monsterTemplate.findFirst({
        where: { name: "Corrupted Miner" },
      });
      const ids = [];
      if (caveSpider) ids.push(caveSpider.id);
      if (corruptedMiner) ids.push(corruptedMiner.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    } else if (template.name === "Mine Horror") {
      const mineHorror = await prisma.monsterTemplate.findFirst({
        where: { name: "Mine Horror" },
      });
      const darkDweller = await prisma.monsterTemplate.findFirst({
        where: { name: "Dark Dweller" },
      });
      const corruptedMiner = await prisma.monsterTemplate.findFirst({
        where: { name: "Corrupted Miner" },
      });
      const ids = [];
      if (mineHorror) ids.push(mineHorror.id);
      if (darkDweller) ids.push(darkDweller.id);
      if (corruptedMiner) ids.push(corruptedMiner.id);
      if ("monsterTemplateIds" in templateData.config) {
        templateData.config.monsterTemplateIds = ids;
      }
    }

    if (!existing) {
      await prisma.eventTemplate.create({
        data: templateData as any,
      });
      console.log(`✓ Created template: ${template.name}`);
    } else {
      await prisma.eventTemplate.update({
        where: { id: existing.id },
        data: templateData as any,
      });
      console.log(`✓ Updated template: ${template.name}`);
    }
  }

  console.log("✅ Event templates seed complete!");

  // Link boss template to Solo Training Ground mission
  console.log("🔗 Linking boss template to Solo Training Ground mission...");
  const trainingGroundMission = await prisma.mission.findFirst({
    where: { name: "Solo Training Ground" },
  });

  if (trainingGroundMission) {
    const masterDummyBossTemplate = await prisma.eventTemplate.findFirst({
      where: { name: "Master Training Dummy Challenge" },
    });

    if (masterDummyBossTemplate) {
      await prisma.mission.update({
        where: { id: trainingGroundMission.id },
        data: { bossTemplateId: masterDummyBossTemplate.id },
      });
      console.log(
        `✅ Linked Master Training Dummy Challenge boss template to Solo Training Ground mission`
      );
    } else {
      console.log("❌ Master Training Dummy Challenge boss template not found");
    }
  } else {
    console.log(
      "❌ Solo Training Ground mission not found for boss template linking"
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Event templates seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
