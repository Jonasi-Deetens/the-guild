import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";

export const characterRouter = createTRPCRouter({
  // Get current character
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        inventory: {
          include: {
            item: true,
          },
        },
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
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return character;
  }),

  // Create new character
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if character already exists
      const existingCharacter = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (existingCharacter) {
        throw new Error("Character already exists");
      }

      // Check if name is taken
      const nameTaken = await ctx.db.character.findUnique({
        where: { name: input.name },
      });

      if (nameTaken) {
        throw new Error("Character name already taken");
      }

      const character = await ctx.db.character.create({
        data: {
          name: input.name,
          userId: ctx.session.user.id,
        },
        include: {
          inventory: {
            include: {
              item: true,
            },
          },
        },
      });

      return character;
    }),

  // Update character online status
  updateOnlineStatus: protectedProcedure
    .input(z.object({ isOnline: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await ctx.db.character.update({
        where: { id: character.id },
        data: {
          isOnline: input.isOnline,
          lastSeen: new Date(),
        },
      });
    }),

  // Get online characters
  getOnline: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.character.findMany({
      where: { isOnline: true },
      select: {
        id: true,
        name: true,
        level: true,
        reputation: true,
        gold: true,
        lastSeen: true,
      },
      orderBy: { lastSeen: "desc" },
    });
  }),

  // Get character by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.character.findUnique({
        where: { id: input.id },
        include: {
          inventory: {
            include: {
              item: true,
            },
          },
        },
      });
    }),
});
