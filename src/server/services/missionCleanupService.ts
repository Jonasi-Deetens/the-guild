import { db } from "@/lib/db";

/**
 * Service for cleaning up expired missions and their associated data
 */
export class MissionCleanupService {
  /**
   * Clean up all expired missions and their phases
   * Missions are considered expired if their missionEndTime has passed (with 30 second buffer)
   */
  static async cleanupExpiredMissions(): Promise<{
    cleanedSessions: number;
    cleanedPhases: number;
    cleanedLoot: number;
    cleanedStatistics: number;
    cleanedTurns: number;
  }> {
    const now = new Date();
    const bufferTime = 30 * 1000; // 30 seconds in milliseconds
    const cutoffTime = new Date(now.getTime() - bufferTime);

    console.log(
      `🧹 [MissionCleanupService] Starting cleanup of missions expired before ${cutoffTime.toISOString()}`
    );

    try {
      // Find all expired sessions
      const expiredSessions = await db.dungeonSession.findMany({
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
        },
      });

      console.log(
        `🧹 [MissionCleanupService] Found ${expiredSessions.length} expired sessions to clean up`
      );

      if (expiredSessions.length === 0) {
        return {
          cleanedSessions: 0,
          cleanedPhases: 0,
          cleanedLoot: 0,
          cleanedStatistics: 0,
          cleanedTurns: 0,
        };
      }

      const sessionIds = expiredSessions.map((session) => session.id);

      // Use transaction to ensure all cleanup operations succeed or fail together
      const result = await db.$transaction(async (tx) => {
        // 1. Delete dungeon turns
        const deletedTurns = await tx.dungeonTurn.deleteMany({
          where: {
            sessionId: {
              in: sessionIds,
            },
          },
        });

        // 2. Delete dungeon statistics
        const deletedStatistics = await tx.dungeonStatistics.deleteMany({
          where: {
            sessionId: {
              in: sessionIds,
            },
          },
        });

        // 3. Delete dungeon loot
        const deletedLoot = await tx.dungeonLoot.deleteMany({
          where: {
            sessionId: {
              in: sessionIds,
            },
          },
        });

        // 4. Delete mission phases
        const deletedPhases = await tx.missionPhase.deleteMany({
          where: {
            sessionId: {
              in: sessionIds,
            },
          },
        });

        // 5. Delete dungeon sessions
        const deletedSessions = await tx.dungeonSession.deleteMany({
          where: {
            id: {
              in: sessionIds,
            },
          },
        });

        return {
          cleanedSessions: deletedSessions.count,
          cleanedPhases: deletedPhases.count,
          cleanedLoot: deletedLoot.count,
          cleanedStatistics: deletedStatistics.count,
          cleanedTurns: deletedTurns.count,
        };
      });

      console.log(
        `✅ [MissionCleanupService] Cleanup completed:`,
        `Sessions: ${result.cleanedSessions},`,
        `Phases: ${result.cleanedPhases},`,
        `Loot: ${result.cleanedLoot},`,
        `Statistics: ${result.cleanedStatistics},`,
        `Turns: ${result.cleanedTurns}`
      );

      return result;
    } catch (error) {
      console.error(`❌ [MissionCleanupService] Error during cleanup:`, error);
      throw error;
    }
  }

  /**
   * Get statistics about expired missions that could be cleaned up
   */
  static async getExpiredMissionStats(): Promise<{
    totalExpired: number;
    byStatus: Record<string, number>;
    oldestExpired: Date | null;
    newestExpired: Date | null;
  }> {
    const now = new Date();
    const bufferTime = 30 * 1000; // 30 seconds in milliseconds
    const cutoffTime = new Date(now.getTime() - bufferTime);

    try {
      const expiredSessions = await db.dungeonSession.findMany({
        where: {
          missionEndTime: {
            lt: cutoffTime,
          },
          status: {
            in: ["COMPLETED", "FAILED", "ABANDONED"],
          },
        },
        select: {
          status: true,
          missionEndTime: true,
        },
        orderBy: {
          missionEndTime: "asc",
        },
      });

      const byStatus = expiredSessions.reduce((acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalExpired: expiredSessions.length,
        byStatus,
        oldestExpired: expiredSessions[0]?.missionEndTime || null,
        newestExpired:
          expiredSessions[expiredSessions.length - 1]?.missionEndTime || null,
      };
    } catch (error) {
      console.error(
        `❌ [MissionCleanupService] Error getting expired mission stats:`,
        error
      );
      throw error;
    }
  }

  /**
   * Clean up missions older than a specific number of days
   */
  static async cleanupMissionsOlderThan(days: number): Promise<{
    cleanedSessions: number;
    cleanedPhases: number;
    cleanedLoot: number;
    cleanedStatistics: number;
    cleanedTurns: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    console.log(
      `🧹 [MissionCleanupService] Starting cleanup of missions older than ${days} days (before ${cutoffDate.toISOString()})`
    );

    try {
      // Find all sessions older than the specified days
      const oldSessions = await db.dungeonSession.findMany({
        where: {
          missionEndTime: {
            lt: cutoffDate,
          },
          status: {
            in: ["COMPLETED", "FAILED", "ABANDONED"],
          },
        },
        select: {
          id: true,
        },
      });

      if (oldSessions.length === 0) {
        console.log(
          `🧹 [MissionCleanupService] No missions older than ${days} days found`
        );
        return {
          cleanedSessions: 0,
          cleanedPhases: 0,
          cleanedLoot: 0,
          cleanedStatistics: 0,
          cleanedTurns: 0,
        };
      }

      const sessionIds = oldSessions.map((session) => session.id);

      // Use transaction to ensure all cleanup operations succeed or fail together
      const result = await db.$transaction(async (tx) => {
        // Delete in reverse dependency order
        const deletedTurns = await tx.dungeonTurn.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });

        const deletedStatistics = await tx.dungeonStatistics.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });

        const deletedLoot = await tx.dungeonLoot.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });

        const deletedPhases = await tx.missionPhase.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });

        const deletedSessions = await tx.dungeonSession.deleteMany({
          where: { id: { in: sessionIds } },
        });

        return {
          cleanedSessions: deletedSessions.count,
          cleanedPhases: deletedPhases.count,
          cleanedLoot: deletedLoot.count,
          cleanedStatistics: deletedStatistics.count,
          cleanedTurns: deletedTurns.count,
        };
      });

      console.log(
        `✅ [MissionCleanupService] Cleanup of missions older than ${days} days completed:`,
        `Sessions: ${result.cleanedSessions},`,
        `Phases: ${result.cleanedPhases},`,
        `Loot: ${result.cleanedLoot},`,
        `Statistics: ${result.cleanedStatistics},`,
        `Turns: ${result.cleanedTurns}`
      );

      return result;
    } catch (error) {
      console.error(
        `❌ [MissionCleanupService] Error during cleanup of old missions:`,
        error
      );
      throw error;
    }
  }
}
