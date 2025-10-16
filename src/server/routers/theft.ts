import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";
import { GoldService } from "@/server/services/goldService";

export const theftRouter = createTRPCRouter({
  // Attempt to steal from another character
  attemptTheft: protectedProcedure
    .input(
      z.object({
        targetId: z.string(),
        amount: z.number().min(1).max(1000), // Max 1000 gold per attempt
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

      // Can't steal from yourself
      if (character.id === targetCharacter.id) {
        throw new Error("You cannot steal from yourself");
      }

      // Check if target has enough gold
      if (targetCharacter.gold < input.amount) {
        throw new Error("Target doesn't have enough gold");
      }

      // Calculate success chance based on perception vs level difference
      const levelDifference = targetCharacter.level - character.level;
      const perceptionBonus = targetCharacter.perception * 2; // Each perception point adds 2% detection chance
      const levelPenalty = Math.max(0, levelDifference * 5); // Each level difference adds 5% detection chance

      const detectionChance = Math.min(95, perceptionBonus + levelPenalty); // Max 95% detection chance
      const successChance = 100 - detectionChance;

      const roll = Math.random() * 100;
      const isSuccess = roll > detectionChance;

      let stolenAmount = 0;
      let reputationChange = 0;

      if (isSuccess) {
        // Successful theft
        stolenAmount = Math.min(input.amount, targetCharacter.gold);

        // Update gold
        await ctx.db.character.update({
          where: { id: character.id },
          data: { gold: { increment: stolenAmount } },
        });

        await ctx.db.character.update({
          where: { id: targetCharacter.id },
          data: { gold: { decrement: stolenAmount } },
        });

        // Reputation penalty for successful theft
        reputationChange = -Math.floor(stolenAmount / 10); // -1 rep per 10 gold stolen
      } else {
        // Failed theft - still get reputation penalty but no gold
        reputationChange = -Math.floor(input.amount / 20); // -1 rep per 20 gold attempted
      }

      // Update reputation
      await ctx.db.character.update({
        where: { id: character.id },
        data: { reputation: { increment: reputationChange } },
      });

      // Create transaction log
      await ctx.db.transaction.create({
        data: {
          actorId: character.id,
          targetId: targetCharacter.id,
          type: "THEFT",
          amount: stolenAmount,
          description: isSuccess
            ? `Successfully stole ${stolenAmount} gold from ${targetCharacter.name}`
            : `Failed to steal ${input.amount} gold from ${targetCharacter.name}`,
          metadata: {
            attemptedAmount: input.amount,
            success: isSuccess,
            detectionChance,
            reputationChange,
          },
        },
      });

      return {
        success: isSuccess,
        stolenAmount,
        reputationChange,
        detectionChance,
        message: isSuccess
          ? `Successfully stole ${stolenAmount} gold!`
          : `Theft attempt failed! ${targetCharacter.name} noticed you.`,
      };
    }),

  // Get theft attempts against a character
  getTheftAttempts: protectedProcedure
    .input(
      z.object({
        type: z.enum(["committed", "victim"]).default("committed"),
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

      const where =
        input.type === "committed"
          ? { actorId: character.id, type: "THEFT" }
          : { targetId: character.id, type: "THEFT" };

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

  // Get theft statistics
  getTheftStats: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const [theftsCommitted, theftsSuffered, totalStolen, totalLost] =
      await Promise.all([
        // Thefts committed
        ctx.db.transaction.count({
          where: { actorId: character.id, type: "THEFT" },
        }),
        // Thefts suffered
        ctx.db.transaction.count({
          where: { targetId: character.id, type: "THEFT" },
        }),
        // Total gold stolen
        ctx.db.transaction.aggregate({
          where: {
            actorId: character.id,
            type: "THEFT",
            amount: { gt: 0 },
          },
          _sum: { amount: true },
        }),
        // Total gold lost
        ctx.db.transaction.aggregate({
          where: {
            targetId: character.id,
            type: "THEFT",
            amount: { gt: 0 },
          },
          _sum: { amount: true },
        }),
      ]);

    return {
      theftsCommitted,
      theftsSuffered,
      totalStolen: totalStolen._sum.amount || 0,
      totalLost: totalLost._sum.amount || 0,
      netGain: (totalStolen._sum.amount || 0) - (totalLost._sum.amount || 0),
    };
  }),

  // Get recent theft activity in the hub
  getRecentTheftActivity: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.transaction.findMany({
        where: { type: "THEFT" },
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

  // Place a bounty on a character
  placeBounty: protectedProcedure
    .input(
      z.object({
        targetId: z.string(),
        amount: z.number().min(100).max(10000), // Min 100, max 10k gold bounty
        reason: z.string().optional(),
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

      // Can't place bounty on yourself
      if (character.id === targetCharacter.id) {
        throw new Error("You cannot place a bounty on yourself");
      }

      // Check if character has enough gold
      if (!(await GoldService.hasEnoughGold(character.id, input.amount))) {
        const currentGold = await GoldService.getGoldAmount(character.id);
        throw new Error(
          `Insufficient gold for bounty. You have ${currentGold} gold, need ${input.amount}.`
        );
      }

      // Deduct gold for bounty
      await GoldService.removeGold(character.id, input.amount);

      // Create bounty
      const bounty = await ctx.db.bounty.create({
        data: {
          placedBy: character.id,
          targetId: targetCharacter.id,
          amount: input.amount,
          reason: input.reason,
          status: "ACTIVE",
        },
        include: {
          placedByCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
          targetCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
        },
      });

      // Create transaction log
      await ctx.db.transaction.create({
        data: {
          actorId: character.id,
          targetId: targetCharacter.id,
          type: "BOUNTY_PLACED",
          amount: input.amount,
          description: `Placed a ${input.amount} gold bounty on ${targetCharacter.name}`,
          metadata: {
            bountyId: bounty.id,
            reason: input.reason,
          },
        },
      });

      return bounty;
    }),

  // Get active bounties
  getActiveBounties: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.bounty.findMany({
        where: { status: "ACTIVE" },
        include: {
          placedByCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
          targetCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
        },
        orderBy: { amount: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // Claim a bounty (kill the target)
  claimBounty: protectedProcedure
    .input(z.object({ bountyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      const bounty = await ctx.db.bounty.findUnique({
        where: { id: input.bountyId },
        include: {
          targetCharacter: true,
          placedByCharacter: true,
        },
      });

      if (!bounty) {
        throw new Error("Bounty not found");
      }

      if (bounty.status !== "ACTIVE") {
        throw new Error("Bounty is not active");
      }

      if (bounty.targetId === character.id) {
        throw new Error("You cannot claim a bounty on yourself");
      }

      // For now, we'll just mark the bounty as claimed
      // In a real game, you'd need to actually "kill" the target character
      await ctx.db.$transaction(async (tx) => {
        // Update bounty status
        await tx.bounty.update({
          where: { id: input.bountyId },
          data: {
            status: "CLAIMED",
            claimedBy: character.id,
            claimedAt: new Date(),
          },
        });

        // Give bounty reward to claimer
        await tx.character.update({
          where: { id: character.id },
          data: { gold: { increment: bounty.amount } },
        });

        // Create transaction log
        await tx.transaction.create({
          data: {
            actorId: character.id,
            targetId: bounty.targetId,
            type: "BOUNTY_CLAIMED",
            amount: bounty.amount,
            description: `Claimed ${bounty.amount} gold bounty on ${bounty.targetCharacter.name}`,
            metadata: {
              bountyId: input.bountyId,
              placedBy: bounty.placedBy,
            },
          },
        });
      });

      return { success: true, amount: bounty.amount };
    }),
});
