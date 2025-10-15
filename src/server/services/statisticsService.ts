import { db } from "@/lib/db";

export class StatisticsService {
  // Initialize statistics for a new dungeon session
  async initializeDungeonStatistics(sessionId: string) {
    console.log("📊 Initializing dungeon statistics for session:", sessionId);
    const result = await db.dungeonStatistics.create({
      data: {
        sessionId,
        // All other fields will default to 0
      },
    });
    console.log("📊 Created dungeon statistics:", result);
    return result;
  }

  // Initialize statistics for a new character
  async initializeCharacterStatistics(characterId: string) {
    return await db.characterStatistics.create({
      data: {
        characterId,
        // All other fields will default to 0
      },
    });
  }

  // Finalize dungeon statistics when dungeon completes
  async finalizeDungeonStatistics(sessionId: string, success: boolean) {
    const stats = await db.dungeonStatistics.findUnique({
      where: { sessionId },
    });

    if (!stats) {
      throw new Error("Dungeon statistics not found");
    }

    // Calculate performance metrics
    const successRate =
      stats.totalEvents > 0
        ? (stats.completedEvents / stats.totalEvents) * 100
        : 0;

    const averageEventTime =
      stats.totalEvents > 0
        ? Math.round(stats.totalTimeSpent / stats.totalEvents)
        : 0;

    const efficiency =
      stats.totalTimeSpent > 0
        ? (stats.goldEarned + stats.experienceGained) /
          (stats.totalTimeSpent / 60)
        : 0;

    return await db.dungeonStatistics.update({
      where: { sessionId },
      data: {
        successRate,
        averageEventTime,
        efficiency,
      },
    });
  }

  // Update character statistics when dungeon completes
  async updateCharacterStatistics(
    characterId: string,
    dungeonStats: {
      success: boolean;
      timeSpent: number;
      goldEarned: number;
      experienceGained: number;
      levelsGained: number;
      enemiesDefeated: number;
      damageDealt: number;
      damageTaken: number;
      timesFled: number;
      itemsFound: number;
      chestsOpened: number;
    }
  ) {
    console.log("📊 updateCharacterStatistics called:", {
      characterId,
      dungeonStats,
    });

    // Get or create character statistics
    let charStats = await db.characterStatistics.findUnique({
      where: { characterId },
    });

    if (!charStats) {
      console.log(
        "📊 Character statistics not found, initializing for:",
        characterId
      );
      charStats = await this.initializeCharacterStatistics(characterId);
    } else {
      console.log("📊 Found existing character statistics:", charStats.id);
    }

    const updates: any = {
      totalTimeSpent: { increment: dungeonStats.timeSpent },
      totalGoldEarned: { increment: dungeonStats.goldEarned },
      totalExperienceGained: { increment: dungeonStats.experienceGained },
      totalLevelsGained: { increment: dungeonStats.levelsGained },
      totalEnemiesDefeated: { increment: dungeonStats.enemiesDefeated },
      totalDamageDealt: { increment: dungeonStats.damageDealt },
      totalDamageTaken: { increment: dungeonStats.damageTaken },
      totalTimesFled: { increment: dungeonStats.timesFled },
      totalItemsFound: { increment: dungeonStats.itemsFound },
      totalChestsOpened: { increment: dungeonStats.chestsOpened },
    };

    if (dungeonStats.success) {
      updates.totalDungeonsCompleted = { increment: 1 };
    } else {
      updates.totalDungeonsFailed = { increment: 1 };
    }

    // Update records
    if (dungeonStats.timeSpent > charStats.longestDungeonTime) {
      updates.longestDungeonTime = dungeonStats.timeSpent;
    }
    if (dungeonStats.goldEarned > charStats.mostGoldInDungeon) {
      updates.mostGoldInDungeon = dungeonStats.goldEarned;
    }
    if (dungeonStats.experienceGained > charStats.mostXPInDungeon) {
      updates.mostXPInDungeon = dungeonStats.experienceGained;
    }
    if (dungeonStats.enemiesDefeated > charStats.mostEnemiesInDungeon) {
      updates.mostEnemiesInDungeon = dungeonStats.enemiesDefeated;
    }

    const updatedStats = await db.characterStatistics.update({
      where: { characterId },
      data: updates,
    });

    // Recalculate performance metrics
    const totalDungeons =
      updatedStats.totalDungeonsCompleted + updatedStats.totalDungeonsFailed;
    const successRate =
      totalDungeons > 0
        ? (updatedStats.totalDungeonsCompleted / totalDungeons) * 100
        : 0;

    const averageDungeonTime =
      totalDungeons > 0
        ? Math.round(updatedStats.totalTimeSpent / totalDungeons)
        : 0;

    const averageGoldPerDungeon =
      totalDungeons > 0
        ? Math.round(updatedStats.totalGoldEarned / totalDungeons)
        : 0;

    const averageXPPerDungeon =
      totalDungeons > 0
        ? Math.round(updatedStats.totalExperienceGained / totalDungeons)
        : 0;

    const finalResult = await db.characterStatistics.update({
      where: { characterId },
      data: {
        successRate,
        averageDungeonTime,
        averageGoldPerDungeon,
        averageXPPerDungeon,
      },
    });

    console.log("📊 Character statistics updated successfully:", {
      characterId,
      totalDungeonsCompleted: finalResult.totalDungeonsCompleted,
      totalGoldEarned: finalResult.totalGoldEarned,
      totalExperienceGained: finalResult.totalExperienceGained,
      successRate: finalResult.successRate,
    });

    return finalResult;
  }

  // Get dungeon statistics
  async getDungeonStatistics(sessionId: string) {
    return await db.dungeonStatistics.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            mission: true,
            party: {
              include: {
                members: {
                  include: {
                    character: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // Get character statistics
  async getCharacterStatistics(characterId: string) {
    return await db.characterStatistics.findUnique({
      where: { characterId },
      include: {
        character: true,
      },
    });
  }

  // Get leaderboard data
  async getLeaderboard(
    type: "gold" | "experience" | "dungeons" | "enemies" | "efficiency",
    limit: number = 10
  ) {
    const orderBy: any = {};

    switch (type) {
      case "gold":
        orderBy.totalGoldEarned = "desc";
        break;
      case "experience":
        orderBy.totalExperienceGained = "desc";
        break;
      case "dungeons":
        orderBy.totalDungeonsCompleted = "desc";
        break;
      case "enemies":
        orderBy.totalEnemiesDefeated = "desc";
        break;
      case "efficiency":
        orderBy.successRate = "desc";
        break;
    }

    return await db.characterStatistics.findMany({
      orderBy,
      take: limit,
      include: {
        character: {
          select: {
            id: true,
            name: true,
            level: true,
            reputation: true,
          },
        },
      },
    });
  }
}

export const statisticsService = new StatisticsService();
