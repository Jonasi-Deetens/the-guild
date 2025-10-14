import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";
import { DungeonEngine } from "@/server/services/dungeonEngine";
import { MissionScheduler } from "@/server/services/missionScheduler";
import { LootService } from "@/server/services/lootService";

const dungeonEngine = new DungeonEngine();

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
          duration: mission.baseDuration,
        },
      });

      return session;
    }),

  // Start a party dungeon session
  startPartySession: protectedProcedure
    .input(
      z.object({
        missionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      // Get mission details
      const mission = await ctx.db.mission.findUnique({
        where: { id: input.missionId },
      });

      if (!mission) {
        throw new Error("Mission not found");
      }

      // Check if all party members are ready
      const partyMembers = await ctx.db.partyMember.findMany({
        where: { partyId: character.partyId },
        include: { character: true },
      });

      const notReadyMembers = partyMembers.filter((member) => !member.isReady);
      if (notReadyMembers.length > 0) {
        throw new Error("Not all party members are ready");
      }

      // Check if party size meets mission requirements
      if (
        partyMembers.length < mission.minPlayers ||
        partyMembers.length > mission.maxPlayers
      ) {
        throw new Error(
          `Party size must be between ${mission.minPlayers} and ${mission.maxPlayers}`
        );
      }

      // Create a party dungeon session
      const session = await ctx.db.dungeonSession.create({
        data: {
          missionId: input.missionId,
          partyId: character.partyId,
          status: "WAITING",
          duration: mission.baseDuration,
        },
      });

      return session;
    }),

  // Get session details
  getSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
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
          events: {
            include: {
              template: true,
              playerActions: {
                include: {
                  character: true,
                },
              },
            },
            orderBy: {
              eventNumber: "asc",
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Check if user has access to this session
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check access: either solo session or party member
      if (session.partyId) {
        const isPartyMember = await ctx.db.partyMember.findFirst({
          where: {
            partyId: session.partyId,
            characterId: character.id,
          },
        });

        if (!isPartyMember) {
          throw new Error("Access denied");
        }
      } else {
        // Solo session - check if character is the one in the session
        // This would need to be tracked differently in a real implementation
        // For now, we'll allow access
      }

      // Find the current active event
      const currentEvent = session.events.find(
        (event) =>
          event.id === session.currentEventId && event.status === "ACTIVE"
      );

      return {
        ...session,
        currentEvent: currentEvent || null,
      };
    }),

  // Start mission
  startMission: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check if character is dead
      if (character.currentHealth <= 0) {
        throw new Error("Character is dead and cannot start a mission");
      }

      // Use the dungeon engine to start the mission
      await dungeonEngine.startMission(input.sessionId);

      return { success: true };
    }),

  // Submit action for current event
  submitAction: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        action: z.string(),
        actionData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Submit the action using the dungeon engine
      const result = await dungeonEngine.submitEventAction(
        input.sessionId,
        character.id,
        input.action,
        input.actionData
      );

      return result;
    }),

  // Get mission status
  getMissionStatus: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await dungeonEngine.getMissionStatus(input.sessionId);
    }),

  // Get current event
  getCurrentEvent: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await dungeonEngine.getCurrentEvent(input.sessionId);
    }),

  // Get available missions
  getAvailableMissions: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const missions = await ctx.db.mission.findMany({
      where: {
        isActive: true,
        minLevel: { lte: character.level },
      },
      orderBy: {
        difficulty: "asc",
      },
    });

    return missions;
  }),

  // Get mission details
  getMission: protectedProcedure
    .input(
      z.object({
        missionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const mission = await ctx.db.mission.findUnique({
        where: { id: input.missionId },
      });

      if (!mission) {
        throw new Error("Mission not found");
      }

      return mission;
    }),

  // Get active sessions for character
  getActiveSessions: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    // Get sessions where character is involved
    const sessions = await ctx.db.dungeonSession.findMany({
      where: {
        OR: [
          // Solo sessions (this would need better tracking in a real implementation)
          {
            partyId: null,
            status: { in: ["WAITING", "ACTIVE"] },
          },
          // Party sessions
          {
            party: {
              members: {
                some: {
                  characterId: character.id,
                },
              },
            },
            status: { in: ["WAITING", "ACTIVE"] },
          },
        ],
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return sessions;
  }),

  // Abandon mission
  abandonMission: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Update session status to abandoned
      const session = await ctx.db.dungeonSession.update({
        where: { id: input.sessionId },
        data: {
          status: "ABANDONED",
          completedAt: new Date(),
        },
      });

      return { success: true };
    }),

  // Get session loot
  getSessionLoot: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Get all loot for the session
      const sessionLoot = await LootService.getSessionLoot(input.sessionId);

      return sessionLoot;
    }),

  // Claim loot for current character
  claimLoot: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Claim loot for the character
      const claimedLoot = await LootService.claimLoot(
        input.sessionId,
        character.id
      );

      return claimedLoot;
    }),
});
