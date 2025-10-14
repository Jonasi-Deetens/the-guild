import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/context";
import { LootDistributionService } from "@/server/services/lootDistributionService";

export const lootDistributionRouter = createTRPCRouter({
  /**
   * Get loot distribution status for a session
   */
  getLootStatus: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await LootDistributionService.getLootDistributionStatus(
        input.sessionId
      );
    }),

  /**
   * Submit a Need/Greed roll for an item
   */
  submitLootRoll: publicProcedure
    .input(
      z.object({
        lootId: z.string(),
        characterId: z.string(),
        rollType: z.enum(["NEED", "GREED"]),
      })
    )
    .mutation(async ({ input }) => {
      return await LootDistributionService.submitLootRoll(
        input.lootId,
        input.characterId,
        input.rollType
      );
    }),

  /**
   * Assign loot manually (Master Looter)
   */
  assignLootManually: publicProcedure
    .input(
      z.object({
        lootId: z.string(),
        characterId: z.string(),
        masterLooterId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await LootDistributionService.assignLootManually(
        input.lootId,
        input.characterId,
        input.masterLooterId
      );
    }),

  /**
   * Distribute loot for a session (called when mission completes)
   */
  distributeLoot: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await LootDistributionService.distributeLoot(input.sessionId);
    }),
});
