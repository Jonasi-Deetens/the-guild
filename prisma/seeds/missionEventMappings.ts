import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting mission event mappings seed...");

  // Get all missions
  const missions = await prisma.mission.findMany();
  console.log(`Found ${missions.length} missions`);

  // Get all event templates
  const eventTemplates = await prisma.eventTemplate.findMany();
  console.log(`Found ${eventTemplates.length} event templates`);

  // Define mission-event mappings with weights
  const missionEventMappings = [
    // BANDIT CAMP MISSION
    {
      missionName: "Bandit Camp",
      events: [
        { eventName: "Bandit Patrol", weight: 3 },
        { eventName: "Bandit Ambush", weight: 3 },
        { eventName: "Enforcer Encounter", weight: 2 },
        { eventName: "Camp Guard", weight: 2 },
        { eventName: "Bandit Captain", weight: 1 }, // Boss event
        // Include some treasure/trap events for variety
        { eventName: "Hidden Cache", weight: 2 },
        { eventName: "Spike Pit", weight: 1 },
        { eventName: "Injured Traveler", weight: 1 },
      ],
    },

    // SLIME DEN MISSION
    {
      missionName: "Slime Den",
      events: [
        { eventName: "Slime Cluster", weight: 3 },
        { eventName: "Slime Variety", weight: 3 },
        { eventName: "Healing Slimes", weight: 2 },
        { eventName: "Elite Slime", weight: 2 },
        { eventName: "Slime King", weight: 1 }, // Boss event
        // Include some treasure/trap events for variety
        { eventName: "Hidden Cache", weight: 2 },
        { eventName: "Poison Dart Trap", weight: 1 },
        { eventName: "Injured Traveler", weight: 1 },
      ],
    },

    // GOBLIN CAVE MISSION
    {
      missionName: "Goblin Cave",
      events: [
        { eventName: "Goblin Raiders", weight: 3 },
        { eventName: "Goblin Ambush", weight: 3 },
        { eventName: "Goblin War Party", weight: 2 },
        { eventName: "Hobgoblin Squad", weight: 2 },
        { eventName: "Goblin Warlord", weight: 1 }, // Boss event
        // Include some treasure/trap events for variety
        { eventName: "Ancient Chest", weight: 2 },
        { eventName: "Spike Pit", weight: 1 },
        { eventName: "Injured Traveler", weight: 1 },
      ],
    },

    // WOLF PACK TERRITORY MISSION
    {
      missionName: "Wolf Pack Territory",
      events: [
        { eventName: "Young Pack", weight: 3 },
        { eventName: "Dire Wolves", weight: 3 },
        { eventName: "Alpha's Pack", weight: 2 },
        { eventName: "Mixed Pack", weight: 2 },
        { eventName: "Werewolf", weight: 1 }, // Boss event
        // Include some treasure/trap events for variety
        { eventName: "Hidden Cache", weight: 2 },
        { eventName: "Poison Dart Trap", weight: 1 },
        { eventName: "Injured Traveler", weight: 1 },
      ],
    },

    // HAUNTED FOREST MISSION
    {
      missionName: "Haunted Forest",
      events: [
        { eventName: "Wandering Spirits", weight: 3 },
        { eventName: "Wraith Attack", weight: 3 },
        { eventName: "Poltergeist Chaos", weight: 2 },
        { eventName: "Spirit Horde", weight: 2 },
        { eventName: "Banshee", weight: 1 }, // Boss event
        // Include some treasure/trap events for variety
        { eventName: "Ancient Chest", weight: 2 },
        { eventName: "Spike Pit", weight: 1 },
        { eventName: "Injured Traveler", weight: 1 },
      ],
    },

    // ABANDONED MINE MISSION
    {
      missionName: "Abandoned Mine",
      events: [
        { eventName: "Spider Nest", weight: 3 },
        { eventName: "Corrupted Workers", weight: 3 },
        { eventName: "Dark Ambush", weight: 2 },
        { eventName: "Mine Patrol", weight: 2 },
        { eventName: "Mine Horror", weight: 1 }, // Boss event
        // Include some treasure/trap events for variety
        { eventName: "Ancient Chest", weight: 2 },
        { eventName: "Poison Dart Trap", weight: 1 },
        { eventName: "Injured Traveler", weight: 1 },
      ],
    },
  ];

  // Process each mission mapping
  for (const mapping of missionEventMappings) {
    const mission = missions.find((m) => m.name === mapping.missionName);
    if (!mission) {
      console.log(`⚠️ Mission "${mapping.missionName}" not found, skipping...`);
      continue;
    }

    console.log(`\n📋 Processing mission: ${mission.name}`);

    // Clear existing event mappings for this mission
    await prisma.missionEventTemplate.deleteMany({
      where: { missionId: mission.id },
    });

    // Add new event mappings
    for (const eventMapping of mapping.events) {
      const eventTemplate = eventTemplates.find(
        (et) => et.name === eventMapping.eventName
      );
      if (!eventTemplate) {
        console.log(
          `⚠️ Event template "${eventMapping.eventName}" not found, skipping...`
        );
        continue;
      }

      await prisma.missionEventTemplate.create({
        data: {
          missionId: mission.id,
          eventTemplateId: eventTemplate.id,
          weight: eventMapping.weight,
        },
      });

      console.log(
        `✓ Mapped "${eventMapping.eventName}" to "${mission.name}" (weight: ${eventMapping.weight})`
      );
    }
  }

  console.log("\n🌱 Mission event mappings seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding mission event mappings:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
