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

  // Clean up expired hires (admin function)
  cleanupExpired: protectedProcedure.mutation(async () => {
    await NPCService.cleanupExpiredHires();
    return { success: true, message: "Expired NPC hires cleaned up" };
  }),
});
