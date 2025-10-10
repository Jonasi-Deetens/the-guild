import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";
import { statisticsService } from "@/server/services/statisticsService";

export const statisticsRouter = createTRPCRouter({
  // Get dungeon statistics for a specific session
  getDungeonStatistics: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await statisticsService.getDungeonStatistics(input.sessionId);
    }),

  // Get character statistics
  getCharacterStatistics: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    let charStats = await statisticsService.getCharacterStatistics(
      character.id
    );

    // If character statistics don't exist, create them
    if (!charStats) {
      await statisticsService.initializeCharacterStatistics(character.id);
      charStats = await statisticsService.getCharacterStatistics(character.id);
    }

    return charStats;
  }),

  // Get leaderboard data
  getLeaderboard: publicProcedure
    .input(
      z.object({
        type: z.enum([
          "gold",
          "experience",
          "dungeons",
          "enemies",
          "efficiency",
        ]),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      return await statisticsService.getLeaderboard(input.type, input.limit);
    }),

  // Get character's recent dungeon history
  getRecentDungeons: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Get recent dungeon sessions where this character participated
      const recentSessions = await ctx.db.dungeonSession.findMany({
        where: {
          OR: [
            // Party missions where character was a member
            {
              party: {
                members: {
                  some: {
                    characterId: character.id,
                  },
                },
              },
            },
            // Solo missions (we'd need to track this differently)
            // For now, we'll focus on party missions
          ],
          status: {
            in: ["COMPLETED", "FAILED"],
          },
        },
        include: {
          mission: true,
          statistics: true,
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
        orderBy: {
          completedAt: "desc",
        },
        take: input.limit,
      });

      return recentSessions;
    }),

  // Get character's performance summary
  getPerformanceSummary: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    console.log("📊 Getting performance summary for character:", character.id);

    let charStats = await statisticsService.getCharacterStatistics(
      character.id
    );

    console.log("📊 Character statistics found:", charStats);

    // If character statistics don't exist, create them
    if (!charStats) {
      console.log("📊 Creating character statistics for:", character.id);
      await statisticsService.initializeCharacterStatistics(character.id);
      charStats = await statisticsService.getCharacterStatistics(character.id);
      console.log("📊 Created character statistics:", charStats);
    }

    // Debug: Check if there are any dungeon statistics for this character
    const dungeonStats = await ctx.db.dungeonStatistics.findMany({
      where: {
        session: {
          OR: [
            { party: { members: { some: { characterId: character.id } } } },
            {
              events: {
                some: {
                  playerActions: { some: { characterId: character.id } },
                },
              },
            },
          ],
        },
      },
    });
    console.log(
      "📊 Found dungeon statistics:",
      dungeonStats.length,
      "sessions"
    );

    if (!charStats) {
      return {
        totalDungeons: 0,
        successRate: 0,
        averageTime: 0,
        totalGold: 0,
        totalXP: 0,
        totalEnemies: 0,
        rank: null,
      };
    }

    // Get character's rank in different categories
    const goldRank = await ctx.db.characterStatistics.count({
      where: {
        totalGoldEarned: {
          gt: charStats.totalGoldEarned,
        },
      },
    });

    const dungeonRank = await ctx.db.characterStatistics.count({
      where: {
        totalDungeonsCompleted: {
          gt: charStats.totalDungeonsCompleted,
        },
      },
    });

    return {
      totalDungeons:
        charStats.totalDungeonsCompleted + charStats.totalDungeonsFailed,
      successRate: charStats.successRate,
      averageTime: charStats.averageDungeonTime,
      totalGold: charStats.totalGoldEarned,
      totalXP: charStats.totalExperienceGained,
      totalEnemies: charStats.totalEnemiesDefeated,
      rank: {
        gold: goldRank + 1,
        dungeons: dungeonRank + 1,
      },
      records: {
        longestDungeon: charStats.longestDungeonTime,
        mostGold: charStats.mostGoldInDungeon,
        mostXP: charStats.mostXPInDungeon,
        mostEnemies: charStats.mostEnemiesInDungeon,
      },
    };
  }),

  // Get event type breakdown for character
  getEventTypeBreakdown: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    // Get all dungeon statistics for this character's dungeons
    const dungeonStats = await ctx.db.dungeonStatistics.findMany({
      where: {
        session: {
          OR: [
            {
              party: {
                members: {
                  some: {
                    characterId: character.id,
                  },
                },
              },
            },
          ],
        },
      },
    });

    // Aggregate event type counts
    const breakdown = {
      combat: 0,
      treasure: 0,
      trap: 0,
      puzzle: 0,
      choice: 0,
      rest: 0,
      boss: 0,
    };

    for (const stats of dungeonStats) {
      breakdown.combat += stats.combatEvents;
      breakdown.treasure += stats.treasureEvents;
      breakdown.trap += stats.trapEvents;
      breakdown.puzzle += stats.puzzleEvents;
      breakdown.choice += stats.choiceEvents;
      breakdown.rest += stats.restEvents;
      breakdown.boss += stats.bossEvents;
    }

    return breakdown;
  }),
});
