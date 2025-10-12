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
        // New monster template system
        monsterTemplateIds: [
          "cmglkno020000umrsi8917116",
          "cmglkno0p0004umrsgqn21ds9",
        ], // Goblin Warrior, Goblin Archer
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
        // New monster template system
        monsterTemplateIds: [
          "cmglkno0e0002umrsdos6vngr",
          "cmglkno0u0005umrsplb47dhx",
          "cmglkno180008umrswssz3ruo",
        ], // Knight, Bandit Scout, Dark Mage
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
        monsterTemplateIds: ["cmglkno0u0005umrsplb47dhx"], // Bandit Scout
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
        // New monster template system
        monsterTemplateIds: [
          "cmglkno1m000bumrsbt4ytwz3", // Warlock
          "cmglkno2t000kumrszk2ec0bn", // Rage Demon
          "cmglkno31000mumrsiu9nxqd4", // Lich King
        ],
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
    // Boss event (spawns at end for CLEAR missions)
    {
      type: "BOSS",
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
      type: "BOSS",
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
        // New monster template system
        monsterTemplateIds: ["cmglkno35000numrsdw335ye5"], // Orc Warlord (boss)
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
      type: "BOSS",
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
        // New monster template system
        monsterTemplateIds: ["cmglkno2w000lumrsi2waxhdx"], // Dragon (boss)
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

    if (!existing) {
      await prisma.eventTemplate.create({
        data: template as any,
      });
      console.log(`✓ Created template: ${template.name}`);
    } else {
      await prisma.eventTemplate.update({
        where: { id: existing.id },
        data: template as any,
      });
      console.log(`✓ Updated template: ${template.name}`);
    }
  }

  console.log("✅ Event templates seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Event templates seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
