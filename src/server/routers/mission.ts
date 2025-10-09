import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";

export const missionRouter = createTRPCRouter({
  // Get all active missions
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.mission.findMany({
      where: { isActive: true },
      orderBy: { difficulty: "asc" },
    });
  }),

  // Get mission by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.mission.findUnique({
        where: { id: input.id },
      });
    }),

  // Create new mission (admin only - for now, any authenticated user)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        description: z.string().min(1).max(500),
        difficulty: z.number().min(1).max(5),
        minLevel: z.number().min(1).default(1),
        maxPlayers: z.number().min(2).max(10).default(5),
        minPlayers: z.number().min(2).default(2),
        baseReward: z.number().min(0).default(100),
        experienceReward: z.number().min(0).default(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.mission.create({
        data: input,
      });
    }),

  // Update mission
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50).optional(),
        description: z.string().min(1).max(500).optional(),
        difficulty: z.number().min(1).max(5).optional(),
        minLevel: z.number().min(1).optional(),
        maxPlayers: z.number().min(2).max(10).optional(),
        minPlayers: z.number().min(2).optional(),
        baseReward: z.number().min(0).optional(),
        experienceReward: z.number().min(0).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.mission.update({
        where: { id },
        data,
      });
    }),

  // Delete mission
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.mission.delete({
        where: { id: input.id },
      });
    }),
});
