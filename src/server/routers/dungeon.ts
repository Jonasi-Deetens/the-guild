import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";
import { dungeonEngine } from "@/server/services/dungeonEngine";

export const dungeonRouter = createTRPCRouter({
  // Start a solo dungeon session
  startSoloSession: protectedProcedure
    .input(
      z.object({
        missionId: z.string(),
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

      // Get mission details
      const mission = await ctx.db.mission.findUnique({
        where: { id: input.missionId },
      });

      if (!mission) {
        throw new Error("Mission not found");
      }

      // Check if mission allows solo play (minPlayers = 1)
      if (mission.minPlayers > 1) {
        throw new Error("This mission requires multiple players");
      }

      // Create a solo dungeon session
      const session = await ctx.db.dungeonSession.create({
        data: {
          missionId: input.missionId,
          status: "WAITING",
          partyId: null, // No party for solo
        },
      });

      // Start the solo dungeon
      await dungeonEngine.startSoloDungeon(session.id, character.id);

      return { sessionId: session.id };
    }),

  // Start a dungeon session
  startSession: protectedProcedure
    .input(
      z.object({
        missionId: z.string(),
        partyId: z.string(),
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

      // Check if character is in the party
      const party = await ctx.db.party.findUnique({
        where: { id: input.partyId },
        include: { members: true },
      });

      if (!party) {
        throw new Error("Party not found");
      }

      const isInParty = party.members.some(
        (member) => member.characterId === character.id
      );

      if (!isInParty) {
        throw new Error("Character is not in this party");
      }

      // Check if all party members are ready
      const readyMembers = party.members.filter((member) => member.isReady);
      if (readyMembers.length !== party.members.length) {
        throw new Error("Not all party members are ready");
      }

      // Create dungeon session
      const session = await ctx.db.dungeonSession.create({
        data: {
          missionId: input.missionId,
          partyId: input.partyId,
          status: "WAITING",
        },
        include: {
          mission: true,
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

      // Start the dungeon
      await dungeonEngine.startDungeon(session.id);

      return session;
    }),

  // Submit action for current turn
  submitAction: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        action: z.enum([
          "ATTACK",
          "DEFEND",
          "USE_ITEM",
          "FLEE",
          "BETRAY",
          "WAIT",
        ]),
        targetId: z.string().optional(),
        itemId: z.string().optional(),
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

      // Submit action to dungeon engine
      await dungeonEngine.submitAction(input.sessionId, character.id, {
        characterId: character.id,
        action: input.action,
        targetId: input.targetId,
        itemId: input.itemId,
      });

      return { success: true };
    }),

  // Get dungeon session details
  getSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: input.sessionId },
        include: {
          mission: true,
          party: {
            include: {
              members: {
                include: {
                  character: true,
                },
              },
            },
          },
          turns: {
            include: {
              character: true,
            },
            orderBy: { submittedAt: "desc" },
          },
          loot: {
            include: {
              item: true,
            },
          },
          events: {
            include: {
              playerActions: {
                include: {
                  character: true,
                },
              },
            },
          },
        },
      });

      // For solo missions, we need to get the character data from the events
      if (session && !session.party && session.events.length > 0) {
        const characterActions = session.events
          .flatMap((event) => event.playerActions)
          .map((action) => action.character);

        // Create a mock party structure for solo missions
        const soloCharacter = characterActions[0];
        if (soloCharacter) {
          (session as any).party = {
            members: [
              {
                character: soloCharacter,
              },
            ],
          };
        }
      }

      return session;
    }),

  // Get active sessions for a character
  getActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return await ctx.db.dungeonSession.findMany({
      where: {
        status: "ACTIVE",
        party: {
          members: {
            some: {
              characterId: character.id,
            },
          },
        },
      },
      include: {
        mission: true,
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
  }),

  // Get completed sessions for a character
  getCompletedSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
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

      return await ctx.db.dungeonSession.findMany({
        where: {
          status: {
            in: ["COMPLETED", "FAILED"],
          },
          party: {
            members: {
              some: {
                characterId: character.id,
              },
            },
          },
        },
        include: {
          mission: true,
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
        orderBy: { completedAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // Claim loot from dungeon
  claimLoot: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        lootId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check if character is in the party
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: input.sessionId },
        include: {
          party: {
            include: {
              members: true,
            },
          },
        },
      });

      if (!session) {
        throw new Error("Dungeon session not found");
      }

      const isInParty = session.party.members.some(
        (member) => member.characterId === character.id
      );

      if (!isInParty) {
        throw new Error("Character is not in this party");
      }

      // Check if loot is already claimed
      const loot = await ctx.db.dungeonLoot.findUnique({
        where: { id: input.lootId },
      });

      if (!loot) {
        throw new Error("Loot not found");
      }

      if (loot.claimedBy) {
        throw new Error("Loot already claimed");
      }

      // Claim the loot
      await ctx.db.dungeonLoot.update({
        where: { id: input.lootId },
        data: {
          claimedBy: character.id,
          claimedAt: new Date(),
        },
      });

      // Add item to character's inventory
      await ctx.db.inventory.create({
        data: {
          characterId: character.id,
          itemId: loot.itemId,
          quantity: loot.quantity,
        },
      });

      return { success: true };
    }),

  // Get dungeon statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const [totalSessions, completedSessions, failedSessions] =
      await Promise.all([
        ctx.db.dungeonSession.count({
          where: {
            party: {
              members: {
                some: {
                  characterId: character.id,
                },
              },
            },
          },
        }),
        ctx.db.dungeonSession.count({
          where: {
            status: "COMPLETED",
            party: {
              members: {
                some: {
                  characterId: character.id,
                },
              },
            },
          },
        }),
        ctx.db.dungeonSession.count({
          where: {
            status: "FAILED",
            party: {
              members: {
                some: {
                  characterId: character.id,
                },
              },
            },
          },
        }),
      ]);

    return {
      totalSessions,
      completedSessions,
      failedSessions,
      successRate:
        totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
    };
  }),
});
