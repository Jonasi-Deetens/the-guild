import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";

export const partyRouter = createTRPCRouter({
  // Get all public parties (and user's private party if they're in one)
  getPublic: publicProcedure.query(async ({ ctx }) => {
    // Get user's character if they're logged in
    let userCharacter = null;
    if (ctx.session?.user?.id) {
      userCharacter = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });
    }

    // Build where clause: public parties OR user's party
    const whereClause: any = {
      status: "FORMING",
    };

    if (userCharacter?.partyId) {
      // Include public parties OR user's party (even if private)
      whereClause.OR = [{ isPublic: true }, { id: userCharacter.partyId }];
    } else {
      // Just public parties if user has no party
      whereClause.isPublic = true;
    }

    return await ctx.db.party.findMany({
      where: whereClause,
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            level: true,
            reputation: true,
          },
        },
        members: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                level: true,
                reputation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get party by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.party.findUnique({
        where: { id: input.id },
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              level: true,
              reputation: true,
            },
          },
          members: {
            include: {
              character: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  reputation: true,
                },
              },
            },
          },
        },
      });
    }),

  // Get current user's party
  getMyCurrent: protectedProcedure.query(async ({ ctx }) => {
    // Get current character
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character || !character.partyId) {
      return null;
    }

    // Get the party with full details
    return await ctx.db.party.findUnique({
      where: { id: character.partyId },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            level: true,
            reputation: true,
          },
        },
        members: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                level: true,
                reputation: true,
              },
            },
          },
        },
      },
    });
  }),

  // Create new party
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(30).optional(),
        isPublic: z.boolean().default(false),
        maxMembers: z.number().min(2).max(10).default(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check if character is already in a party
      if (character.partyId) {
        throw new Error("Character is already in a party");
      }

      const party = await ctx.db.party.create({
        data: {
          name: input.name,
          isPublic: input.isPublic,
          maxMembers: input.maxMembers,
          leaderId: character.id,
        },
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              level: true,
              reputation: true,
            },
          },
          members: {
            include: {
              character: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  reputation: true,
                },
              },
            },
          },
        },
      });

      // Add leader as first member
      await ctx.db.partyMember.create({
        data: {
          partyId: party.id,
          characterId: character.id,
          role: "leader",
          isReady: false,
        },
      });

      // Update character's party
      await ctx.db.character.update({
        where: { id: character.id },
        data: { partyId: party.id },
      });

      return party;
    }),

  // Join party
  join: protectedProcedure
    .input(z.object({ partyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check if character is already in a party
      if (character.partyId) {
        throw new Error("Character is already in a party");
      }

      // Get party
      const party = await ctx.db.party.findUnique({
        where: { id: input.partyId },
        include: { members: true },
      });

      if (!party) {
        throw new Error("Party not found");
      }

      if (party.status !== "FORMING") {
        throw new Error("Party is not accepting new members");
      }

      if (party.members.length >= party.maxMembers) {
        throw new Error("Party is full");
      }

      // Add character to party
      await ctx.db.partyMember.create({
        data: {
          partyId: input.partyId,
          characterId: character.id,
          isReady: false,
        },
      });

      // Update character's party
      await ctx.db.character.update({
        where: { id: character.id },
        data: { partyId: input.partyId },
      });

      return { success: true };
    }),

  // Leave party
  leave: protectedProcedure.mutation(async ({ ctx }) => {
    // Get current character
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      include: { party: true },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    if (!character.partyId) {
      throw new Error("Character is not in a party");
    }

    // If character is the leader, disband the party
    if (character.party?.leaderId === character.id) {
      await ctx.db.party.update({
        where: { id: character.partyId },
        data: { status: "DISBANDED" },
      });
    }

    // Remove character from party
    await ctx.db.partyMember.deleteMany({
      where: {
        partyId: character.partyId,
        characterId: character.id,
      },
    });

    // Update character's party
    await ctx.db.character.update({
      where: { id: character.id },
      data: { partyId: null },
    });

    return { success: true };
  }),

  // Toggle ready status
  toggleReady: protectedProcedure
    .input(z.object({ isReady: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      if (!character.partyId) {
        throw new Error("Character is not in a party");
      }

      // Update ready status
      await ctx.db.partyMember.updateMany({
        where: {
          partyId: character.partyId,
          characterId: character.id,
        },
        data: { isReady: input.isReady },
      });

      return { success: true };
    }),
});
