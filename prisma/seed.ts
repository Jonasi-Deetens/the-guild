import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

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
      experienceReward: 20,
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

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
