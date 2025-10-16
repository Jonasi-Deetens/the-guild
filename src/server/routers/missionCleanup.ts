import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/context";
import { MissionCleanupService } from "@/server/services/missionCleanupService";

export const missionCleanupRouter = createTRPCRouter({
  /**
   * Get statistics about expired missions that could be cleaned up
   */
  getExpiredStats: protectedProcedure.query(async () => {
    return await MissionCleanupService.getExpiredMissionStats();
  }),

  /**
   * Clean up all expired missions (missions that ended more than 30 seconds ago)
   */
  cleanupExpired: protectedProcedure.mutation(async () => {
    return await MissionCleanupService.cleanupExpiredMissions();
  }),

  /**
   * Clean up missions older than a specific number of days
   */
  cleanupOlderThan: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365), // Between 1 and 365 days
      })
    )
    .mutation(async ({ input }) => {
      return await MissionCleanupService.cleanupMissionsOlderThan(input.days);
    }),
});
