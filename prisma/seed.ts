import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Seed NPCs first
  console.log("🌱 Seeding NPCs...");
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
      description:
        "A nimble elf rogue with quick reflexes and deadly precision.",
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
      description:
        "A devoted healer with a gentle demeanor and powerful magic.",
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
      description:
        "A skilled ranger with unmatched accuracy and keen eyesight.",
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

  // Create missions
  const missions = [
    {
      name: "Solo Training Ground",
      description:
        "A safe training area for adventurers to practice their skills alone. Perfect for testing your abilities!",
      difficulty: 1,
      minLevel: 1,
      maxPlayers: 1,
      minPlayers: 1,
      baseReward: 50,
      experienceReward: 5, // Reduced from 20
      baseDuration: 300, // 5 minutes
      environmentType: "training_ground",
      totalPhases: 3,
      finalBossTemplateId: null, // Will be set after monster templates are created
      monsterPoolIds: [], // Will be populated with training dummy IDs
      restDuration: 30, // 30 seconds rest penalty
      // Legacy fields (to be removed later)
      minEventInterval: 20,
      maxEventInterval: 40,
      missionType: "CLEAR",
      failCondition: "DEATH_ONLY",
      bossTemplateId: null,
      maxMonstersPerEncounter: 3,
      isActive: true,
    },
    {
      name: "Lone Wolf's Challenge",
      description:
        "A series of challenges designed for solo adventurers. Test your mettle against various obstacles and enemies.",
      difficulty: 2,
      minLevel: 2,
      maxPlayers: 1,
      minPlayers: 1,
      baseReward: 100,
      experienceReward: 40,
      baseDuration: 600,
      environmentType: "forest",
      totalPhases: 4,
      finalBossTemplateId: null,
      monsterPoolIds: [],
      restDuration: 45,
      isActive: true,
    },
    {
      name: "Slime Den",
      description:
        "A den of weak slimes has been discovered near the village. Clear them out for some easy experience and gold. Perfect for beginners!",
      difficulty: 1,
      minLevel: 1,
      maxPlayers: 4,
      minPlayers: 2,
      baseReward: 100,
      experienceReward: 30,
      baseDuration: 600,
      environmentType: "cave",
      totalPhases: 3,
      finalBossTemplateId: null, // Slime King
      monsterPoolIds: [], // Blue Slime, Red Slime, Green Slime
      restDuration: 30,
      isActive: true,
    },
    {
      name: "Bandit Camp",
      description:
        "A group of bandits has been harassing travelers on the road. Deal with them and bring peace to the area.",
      difficulty: 1,
      minLevel: 1,
      maxPlayers: 5,
      minPlayers: 2,
      baseReward: 150,
      experienceReward: 40,
      baseDuration: 600,
      environmentType: "camp",
      totalPhases: 3,
      finalBossTemplateId: null, // Bandit Leader
      monsterPoolIds: [], // Bandit Thug, Bandit Archer, Bandit Rogue
      restDuration: 45,
      isActive: true,
    },
    {
      name: "Goblin Cave",
      description:
        "Goblins have made a cave their home and are raiding nearby farms. Enter their lair and show them who's boss. Watch out for their traps!",
      difficulty: 2,
      minLevel: 3,
      maxPlayers: 4,
      minPlayers: 2,
      baseReward: 250,
      experienceReward: 60,
      baseDuration: 900,
      environmentType: "cave",
      totalPhases: 4,
      finalBossTemplateId: null, // Goblin Chief
      monsterPoolIds: [], // Goblin Warrior, Goblin Shaman, Goblin Scout
      restDuration: 60,
      isActive: true,
    },
    {
      name: "Wolf Pack Territory",
      description:
        "A dangerous pack of dire wolves has claimed the forest as their hunting ground. Thin their numbers before they become a real threat.",
      difficulty: 2,
      minLevel: 4,
      maxPlayers: 5,
      minPlayers: 3,
      baseReward: 300,
      experienceReward: 70,
      baseDuration: 900,
      environmentType: "forest",
      totalPhases: 4,
      finalBossTemplateId: null, // Alpha Wolf
      monsterPoolIds: [], // Dire Wolf, Timber Wolf, Wolf Cub
      restDuration: 60,
      isActive: true,
    },
    {
      name: "Haunted Forest",
      description:
        "Strange whispers and ghostly apparitions plague this cursed forest. Investigate the source of the haunting and put the restless spirits to rest.",
      difficulty: 3,
      minLevel: 5,
      maxPlayers: 4,
      minPlayers: 2,
      baseReward: 400,
      experienceReward: 100,
      baseDuration: 1200,
      environmentType: "forest",
      totalPhases: 5,
      finalBossTemplateId: null, // Wraith Lord
      monsterPoolIds: [], // Ghost, Specter, Shadow
      restDuration: 90,
      isActive: true,
    },
    {
      name: "Abandoned Mine",
      description:
        "The old mine was abandoned after strange creatures emerged from the depths. Venture into the darkness and discover what lies below.",
      difficulty: 3,
      minLevel: 6,
      maxPlayers: 5,
      minPlayers: 3,
      baseReward: 450,
      experienceReward: 110,
      baseDuration: 1200,
      environmentType: "cave",
      totalPhases: 5,
      finalBossTemplateId: null, // Cave Troll
      monsterPoolIds: [], // Rock Golem, Cave Spider, Bat Swarm
      restDuration: 90,
      isActive: true,
    },
    {
      name: "Ancient Ruins",
      description:
        "Ancient ruins have been discovered, filled with forgotten magic and deadly guardians. Only experienced adventurers should attempt this mission.",
      difficulty: 4,
      minLevel: 8,
      maxPlayers: 5,
      minPlayers: 3,
      baseReward: 600,
      experienceReward: 150,
      isActive: true,
    },
    {
      name: "Vampire Crypt",
      description:
        "A vampire lord has awakened from centuries of slumber and is gathering an army of undead. Strike at their crypt before it's too late!",
      difficulty: 4,
      minLevel: 9,
      maxPlayers: 5,
      minPlayers: 4,
      baseReward: 700,
      experienceReward: 170,
      isActive: true,
    },
    {
      name: "Dragon's Lair",
      description:
        "An ancient red dragon has been terrorizing the kingdom for weeks. Gather your strongest allies and challenge the beast in its mountain lair. Only the bravest dare attempt this legendary quest.",
      difficulty: 5,
      minLevel: 12,
      maxPlayers: 5,
      minPlayers: 4,
      baseReward: 1000,
      experienceReward: 200,
      isActive: true,
    },
    {
      name: "Demon Tower",
      description:
        "A tower has appeared overnight, radiating dark energy. Demons pour forth from its gates. Climb to the top and seal the portal before the world falls to darkness.",
      difficulty: 5,
      minLevel: 15,
      maxPlayers: 5,
      minPlayers: 5,
      baseReward: 1200,
      experienceReward: 250,
      isActive: true,
    },
  ];

  console.log("📝 Creating missions...");
  for (const mission of missions) {
    const existing = await prisma.mission.findFirst({
      where: { name: mission.name },
    });

    if (!existing) {
      await prisma.mission.create({
        data: mission,
      });
      console.log(`✓ Created mission: ${mission.name}`);
    } else {
      console.log(`⊘ Mission already exists: ${mission.name}`);
    }
  }

  // Update missions with monster pool IDs and boss IDs
  console.log("🎯 Updating missions with monster pools...");

  // Update Solo Training Ground
  const trainingMission = await prisma.mission.findFirst({
    where: { name: "Solo Training Ground" },
  });
  if (trainingMission) {
    const trainingMonsters = await prisma.monsterTemplate.findMany({
      where: {
        name: {
          in: [
            "Training Dummy",
            "Advanced Training Dummy",
            "Master Training Dummy",
          ],
        },
      },
    });
    await prisma.mission.update({
      where: { id: trainingMission.id },
      data: {
        monsterPoolIds: trainingMonsters.map((m) => m.id),
        finalBossTemplateId:
          trainingMonsters.find((m) => m.name === "Master Training Dummy")
            ?.id || null,
      },
    });
    console.log(
      `✓ Updated Solo Training Ground with ${trainingMonsters.length} monster types`
    );
  }

  // Update Slime Den
  const slimeMission = await prisma.mission.findFirst({
    where: { name: "Slime Den" },
  });
  if (slimeMission) {
    const slimeMonsters = await prisma.monsterTemplate.findMany({
      where: {
        name: { in: ["Blue Slime", "Red Slime", "Green Slime"] },
      },
    });
    const slimeKing = await prisma.monsterTemplate.findFirst({
      where: { name: "Slime King" },
    });
    await prisma.mission.update({
      where: { id: slimeMission.id },
      data: {
        monsterPoolIds: slimeMonsters.map((m) => m.id),
        finalBossTemplateId: slimeKing?.id || null,
      },
    });
    console.log(
      `✓ Updated Slime Den with ${slimeMonsters.length} monster types`
    );
  }

  // Update Bandit Camp
  const banditMission = await prisma.mission.findFirst({
    where: { name: "Bandit Camp" },
  });
  if (banditMission) {
    const banditMonsters = await prisma.monsterTemplate.findMany({
      where: {
        name: { in: ["Bandit Thug", "Bandit Archer", "Bandit Rogue"] },
      },
    });
    const banditLeader = await prisma.monsterTemplate.findFirst({
      where: { name: "Bandit Leader" },
    });
    await prisma.mission.update({
      where: { id: banditMission.id },
      data: {
        monsterPoolIds: banditMonsters.map((m) => m.id),
        finalBossTemplateId: banditLeader?.id || null,
      },
    });
    console.log(
      `✓ Updated Bandit Camp with ${banditMonsters.length} monster types`
    );
  }

  // Update Goblin Cave
  const goblinMission = await prisma.mission.findFirst({
    where: { name: "Goblin Cave" },
  });
  if (goblinMission) {
    const goblinMonsters = await prisma.monsterTemplate.findMany({
      where: {
        name: { in: ["Goblin Warrior", "Goblin Shaman", "Goblin Scout"] },
      },
    });
    const goblinChief = await prisma.monsterTemplate.findFirst({
      where: { name: "Goblin Chief" },
    });
    await prisma.mission.update({
      where: { id: goblinMission.id },
      data: {
        monsterPoolIds: goblinMonsters.map((m) => m.id),
        finalBossTemplateId: goblinChief?.id || null,
      },
    });
    console.log(
      `✓ Updated Goblin Cave with ${goblinMonsters.length} monster types`
    );
  }

  // Update Wolf Pack Territory
  const wolfMission = await prisma.mission.findFirst({
    where: { name: "Wolf Pack Territory" },
  });
  if (wolfMission) {
    const wolfMonsters = await prisma.monsterTemplate.findMany({
      where: {
        name: { in: ["Dire Wolf", "Timber Wolf", "Wolf Cub"] },
      },
    });
    const alphaWolf = await prisma.monsterTemplate.findFirst({
      where: { name: "Alpha Wolf" },
    });
    await prisma.mission.update({
      where: { id: wolfMission.id },
      data: {
        monsterPoolIds: wolfMonsters.map((m) => m.id),
        finalBossTemplateId: alphaWolf?.id || null,
      },
    });
    console.log(
      `✓ Updated Wolf Pack Territory with ${wolfMonsters.length} monster types`
    );
  }

  // Update Haunted Forest
  const hauntedMission = await prisma.mission.findFirst({
    where: { name: "Haunted Forest" },
  });
  if (hauntedMission) {
    const ghostMonsters = await prisma.monsterTemplate.findMany({
      where: {
        name: { in: ["Ghost", "Specter", "Shadow"] },
      },
    });
    const wraithLord = await prisma.monsterTemplate.findFirst({
      where: { name: "Wraith Lord" },
    });
    await prisma.mission.update({
      where: { id: hauntedMission.id },
      data: {
        monsterPoolIds: ghostMonsters.map((m) => m.id),
        finalBossTemplateId: wraithLord?.id || null,
      },
    });
    console.log(
      `✓ Updated Haunted Forest with ${ghostMonsters.length} monster types`
    );
  }

  // Update Abandoned Mine
  const mineMission = await prisma.mission.findFirst({
    where: { name: "Abandoned Mine" },
  });
  if (mineMission) {
    const mineMonsters = await prisma.monsterTemplate.findMany({
      where: {
        name: { in: ["Rock Golem", "Cave Spider", "Bat Swarm"] },
      },
    });
    const caveTroll = await prisma.monsterTemplate.findFirst({
      where: { name: "Cave Troll" },
    });
    await prisma.mission.update({
      where: { id: mineMission.id },
      data: {
        monsterPoolIds: mineMonsters.map((m) => m.id),
        finalBossTemplateId: caveTroll?.id || null,
      },
    });
    console.log(
      `✓ Updated Abandoned Mine with ${mineMonsters.length} monster types`
    );
  }

  console.log("✅ Seed complete!");
}

// Import and run all seed files
import "./seeds/monsters";
import "./seeds/monsterLoot";

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
