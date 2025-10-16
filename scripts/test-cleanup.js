const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testCleanup() {
  console.log("🧪 Testing Mission Cleanup Service...\n");

  try {
    // 1. Check current expired missions
    const now = new Date();
    const bufferTime = 30 * 1000; // 30 seconds
    const cutoffTime = new Date(now.getTime() - bufferTime);

    console.log(
      `📊 Checking for missions expired before: ${cutoffTime.toISOString()}\n`
    );

    const expiredSessions = await prisma.dungeonSession.findMany({
      where: {
        missionEndTime: {
          lt: cutoffTime,
        },
        status: {
          in: ["COMPLETED", "FAILED", "ABANDONED"],
        },
      },
      select: {
        id: true,
        status: true,
        missionEndTime: true,
        mission: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        missionEndTime: "desc",
      },
    });

    console.log(`Found ${expiredSessions.length} expired sessions:`);
    expiredSessions.forEach((session, index) => {
      console.log(
        `  ${index + 1}. ${session.mission.name} (${
          session.status
        }) - ${session.missionEndTime.toISOString()}`
      );
    });

    if (expiredSessions.length === 0) {
      console.log("\n✅ No expired sessions found. Database is clean!");
      return;
    }

    // 2. Check related data that would be cleaned up
    const sessionIds = expiredSessions.map((s) => s.id);

    const phases = await prisma.missionPhase.count({
      where: {
        sessionId: { in: sessionIds },
      },
    });

    const loot = await prisma.dungeonLoot.count({
      where: {
        sessionId: { in: sessionIds },
      },
    });

    const statistics = await prisma.dungeonStatistics.count({
      where: {
        sessionId: { in: sessionIds },
      },
    });

    const turns = await prisma.dungeonTurn.count({
      where: {
        sessionId: { in: sessionIds },
      },
    });

    console.log(`\n📈 Related data that would be cleaned up:`);
    console.log(`  - Phases: ${phases}`);
    console.log(`  - Loot: ${loot}`);
    console.log(`  - Statistics: ${statistics}`);
    console.log(`  - Turns: ${turns}`);

    // 3. Show what would be deleted
    console.log(`\n🗑️  Cleanup would remove:`);
    console.log(`  - ${expiredSessions.length} dungeon sessions`);
    console.log(`  - ${phases} mission phases`);
    console.log(`  - ${loot} loot records`);
    console.log(`  - ${statistics} statistics records`);
    console.log(`  - ${turns} turn records`);

    console.log(`\n⚠️  This is a test run - no data was actually deleted.`);
    console.log(
      `   To actually run cleanup, use the admin panel or tRPC endpoints.`
    );
  } catch (error) {
    console.error("❌ Error during cleanup test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCleanup();
