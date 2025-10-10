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

    // Check if character is actually a member of the party
    const partyMember = await ctx.db.partyMember.findUnique({
      where: {
        partyId_characterId: {
          partyId: character.partyId,
          characterId: character.id,
        },
      },
    });

    if (!partyMember) {
      // Character has partyId but is not actually a member - clean up
      console.log(`Cleaning up orphaned partyId for character ${character.id}`);
      await ctx.db.character.update({
        where: { id: character.id },
        data: { partyId: null },
      });
      return null;
    }

    // Get the party with full details
    const party = await ctx.db.party.findUnique({
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

    // Double-check that the party exists and is not disbanded
    if (!party || party.status === "DISBANDED") {
      console.log(
        `Party ${character.partyId} not found or disbanded, cleaning up character ${character.id}`
      );
      await ctx.db.character.update({
        where: { id: character.id },
        data: { partyId: null },
      });
      return null;
    }

    return party;
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
      // Character is not in a party - this is fine, just return success
      return { success: true, message: "Character is not in a party" };
    }

    // Verify character is actually a member
    const partyMember = await ctx.db.partyMember.findUnique({
      where: {
        partyId_characterId: {
          partyId: character.partyId,
          characterId: character.id,
        },
      },
    });

    if (!partyMember) {
      // Character has partyId but is not actually a member - clean up and return
      console.log(
        `Character ${character.id} has partyId ${character.partyId} but is not a member, cleaning up`
      );
      await ctx.db.character.update({
        where: { id: character.id },
        data: { partyId: null },
      });
      return {
        success: true,
        message: "Left party (was not actually a member)",
      };
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

  // Clean up party data inconsistencies (for debugging)
  cleanup: protectedProcedure.mutation(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    let cleaned = false;
    let message = "No cleanup needed";

    // Check if character has partyId but is not actually a member
    if (character.partyId) {
      const partyMember = await ctx.db.partyMember.findUnique({
        where: {
          partyId_characterId: {
            partyId: character.partyId,
            characterId: character.id,
          },
        },
      });

      if (!partyMember) {
        await ctx.db.character.update({
          where: { id: character.id },
          data: { partyId: null },
        });
        cleaned = true;
        message = "Removed orphaned partyId";
      } else {
        // Check if party exists and is not disbanded
        const party = await ctx.db.party.findUnique({
          where: { id: character.partyId },
        });

        if (!party || party.status === "DISBANDED") {
          await ctx.db.character.update({
            where: { id: character.id },
            data: { partyId: null },
          });
          cleaned = true;
          message = "Removed reference to non-existent/disbanded party";
        }
      }
    }

    return { success: true, cleaned, message };
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
