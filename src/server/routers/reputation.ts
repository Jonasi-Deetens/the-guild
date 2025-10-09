import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";

export const reputationRouter = createTRPCRouter({
  // Get character reputation and transaction history
  getCharacterReputation: publicProcedure
    .input(z.object({ characterId: z.string() }))
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { id: input.characterId },
        select: {
          id: true,
          name: true,
          level: true,
          reputation: true,
          createdAt: true,
        },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Get recent transactions
      const recentTransactions = await ctx.db.transaction.findMany({
        where: {
          OR: [{ actorId: input.characterId }, { targetId: input.characterId }],
        },
        include: {
          actor: {
            select: { id: true, name: true, level: true, reputation: true },
          },
          target: {
            select: { id: true, name: true, level: true, reputation: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      // Get reputation breakdown
      const reputationBreakdown = await ctx.db.transaction.groupBy({
        by: ["type"],
        where: {
          OR: [{ actorId: input.characterId }, { targetId: input.characterId }],
        },
        _count: { type: true },
        _sum: { amount: true },
      });

      return {
        character,
        recentTransactions,
        reputationBreakdown,
      };
    }),

  // Get transaction history for current character
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        type: z
          .enum([
            "ALL",
            "TRADE",
            "THEFT",
            "BOUNTY_PLACED",
            "BOUNTY_CLAIMED",
            "MISSION_REWARD",
            "DUNGEON_LOOT",
          ])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      const where: any = {
        OR: [{ actorId: character.id }, { targetId: character.id }],
      };

      if (input.type && input.type !== "ALL") {
        where.type = input.type;
      }

      return await ctx.db.transaction.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, level: true, reputation: true },
          },
          target: {
            select: { id: true, name: true, level: true, reputation: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // Get reputation leaderboard
  getReputationLeaderboard: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(["reputation", "level", "gold"]).default("reputation"),
      })
    )
    .query(async ({ ctx, input }) => {
      const orderBy: any = {};
      orderBy[input.sortBy] = "desc";

      return await ctx.db.character.findMany({
        select: {
          id: true,
          name: true,
          level: true,
          reputation: true,
          gold: true,
          createdAt: true,
        },
        orderBy,
        take: input.limit,
        skip: input.offset,
      });
    }),

  // Get recent activity feed
  getRecentActivity: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        types: z
          .array(
            z.enum([
              "TRADE",
              "THEFT",
              "BOUNTY_PLACED",
              "BOUNTY_CLAIMED",
              "MISSION_REWARD",
              "DUNGEON_LOOT",
            ])
          )
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.types && input.types.length > 0) {
        where.type = { in: input.types };
      }

      return await ctx.db.transaction.findMany({
        where,
        include: {
          actor: {
            select: { id: true, name: true, level: true, reputation: true },
          },
          target: {
            select: { id: true, name: true, level: true, reputation: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get character statistics
  getCharacterStats: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const [
      totalTransactions,
      tradesCompleted,
      theftsCommitted,
      theftsSuffered,
      bountiesPlaced,
      bountiesClaimed,
      totalGoldEarned,
      totalGoldLost,
    ] = await Promise.all([
      // Total transactions
      ctx.db.transaction.count({
        where: {
          OR: [{ actorId: character.id }, { targetId: character.id }],
        },
      }),
      // Trades completed
      ctx.db.transaction.count({
        where: { actorId: character.id, type: "TRADE" },
      }),
      // Thefts committed
      ctx.db.transaction.count({
        where: { actorId: character.id, type: "THEFT" },
      }),
      // Thefts suffered
      ctx.db.transaction.count({
        where: { targetId: character.id, type: "THEFT" },
      }),
      // Bounties placed
      ctx.db.transaction.count({
        where: { actorId: character.id, type: "BOUNTY_PLACED" },
      }),
      // Bounties claimed
      ctx.db.transaction.count({
        where: { actorId: character.id, type: "BOUNTY_CLAIMED" },
      }),
      // Total gold earned
      ctx.db.transaction.aggregate({
        where: {
          actorId: character.id,
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      }),
      // Total gold lost
      ctx.db.transaction.aggregate({
        where: {
          targetId: character.id,
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalTransactions,
      tradesCompleted,
      theftsCommitted,
      theftsSuffered,
      bountiesPlaced,
      bountiesClaimed,
      totalGoldEarned: totalGoldEarned._sum.amount || 0,
      totalGoldLost: totalGoldLost._sum.amount || 0,
      netGoldChange:
        (totalGoldEarned._sum.amount || 0) - (totalGoldLost._sum.amount || 0),
    };
  }),

  // Report a character for misconduct
  reportCharacter: protectedProcedure
    .input(
      z.object({
        targetId: z.string(),
        reason: z.enum(["CHEATING", "HARASSMENT", "EXPLOIT", "OTHER"]),
        description: z.string().min(10).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check if target character exists
      const targetCharacter = await ctx.db.character.findUnique({
        where: { id: input.targetId },
      });

      if (!targetCharacter) {
        throw new Error("Target character not found");
      }

      // Can't report yourself
      if (character.id === targetCharacter.id) {
        throw new Error("You cannot report yourself");
      }

      // Create report
      const report = await ctx.db.report.create({
        data: {
          reporterId: character.id,
          reportedId: input.targetId,
          reason: input.reason,
          description: input.description,
          status: "PENDING",
        },
      });

      return report;
    }),

  // Get reports made by current character
  getMyReports: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await ctx.db.report.findMany({
        where: { reporterId: character.id },
        include: {
          reported: {
            select: { id: true, name: true, level: true, reputation: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),
});
