import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";
import { NPCService } from "@/server/services/npcService";

export const npcRouter = createTRPCRouter({
  // Get all available NPCs for the current character
  getAvailable: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return await NPCService.getAvailableNPCs(character.id);
  }),

  // Get NPCs that the character has unlocked (milestone NPCs)
  getUnlocked: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return await NPCService.getUnlockedNPCs(character.id);
  }),

  // Get NPCs currently hired by the character
  getHired: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return await NPCService.getHiredNPCs(character.id);
  }),

  // Hire an NPC
  hire: protectedProcedure
    .input(
      z.object({
        npcId: z.string(),
        sessionId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await NPCService.hireNPC(
        character.id,
        input.npcId,
        input.sessionId
      );
    }),

  // Dismiss an NPC
  dismiss: protectedProcedure
    .input(z.object({ npcId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await NPCService.dismissNPC(character.id, input.npcId);
    }),

  // Unlock a milestone NPC (usually called automatically)
  unlock: protectedProcedure
    .input(z.object({ npcId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await NPCService.unlockMilestoneNPC(character.id, input.npcId);
    }),

  // Check and unlock milestone NPCs based on character progress
  checkUnlocks: protectedProcedure.mutation(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const newlyUnlocked = await NPCService.checkUnlockRequirements(
      character.id
    );

    return {
      success: true,
      newlyUnlocked,
      message:
        newlyUnlocked.length > 0
          ? `Unlocked ${newlyUnlocked.length} new NPCs!`
          : "No new NPCs to unlock",
    };
  }),

  // Get NPC by ID (for detailed view)
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.nPCCompanion.findUnique({
        where: { id: input.id },
      });
    }),

  // Get all NPCs (for admin/debugging)
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.nPCCompanion.findMany({
      orderBy: [{ unlockType: "asc" }, { rarity: "asc" }, { level: "asc" }],
    });
  }),

  // Update NPC health (for real-time combat updates)
  updateHealth: protectedProcedure
    .input(
      z.object({
        npcId: z.string(),
        newHealth: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the NPC is hired by the current user's character
      const character = await ctx.db.character.findFirst({
        where: { userId: ctx.session.user.id },
        include: {
          party: {
            include: {
              members: {
                where: {
                  isNPC: true,
                  npcCompanionId: input.npcId,
                },
              },
            },
          },
        },
      });

      if (
        !character ||
        !character.party ||
        character.party.members.length === 0
      ) {
        throw new Error("NPC not found or access denied");
      }

      // Update the NPC's health
      const updatedNPC = await ctx.db.nPCCompanion.update({
        where: { id: input.npcId },
        data: { currentHealth: input.newHealth },
        select: {
          id: true,
          name: true,
          currentHealth: true,
          maxHealth: true,
        },
      });

      return updatedNPC;
    }),

  // Clean up expired hires (admin function)
  cleanupExpired: protectedProcedure.mutation(async () => {
    await NPCService.cleanupExpiredHires();
    return { success: true, message: "Expired NPC hires cleaned up" };
  }),
});
