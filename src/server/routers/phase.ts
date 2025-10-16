import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/context";
import { PhaseManager } from "@/server/services/phaseManager";
import { RestPhaseService } from "@/server/services/restPhaseService";

export const phaseRouter = createTRPCRouter({
  /**
   * Get current phase information for a session
   */
  getCurrentPhase: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { sessionId } = input;

      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Verify user has access to this session
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: {
          party: {
            include: {
              members: {
                include: {
                  character: true,
                  npcCompanion: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
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
      }

      return await PhaseManager.getCurrentPhase(sessionId);
    }),

  /**
   * Start a rest period for the current phase
   */
  startRest: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        phaseNumber: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, phaseNumber } = input;

      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Verify user has access to this session
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: {
          party: {
            include: {
              members: {
                include: {
                  character: true,
                  npcCompanion: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
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
      }

      await PhaseManager.startRestPeriod(sessionId, phaseNumber);
      return { success: true };
    }),

  /**
   * End rest period and proceed to next phase
   */
  endRest: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        phaseNumber: z.number(),
        didRest: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, phaseNumber, didRest } = input;

      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Verify user has access to this session
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: {
          party: {
            include: {
              members: {
                include: {
                  character: true,
                  npcCompanion: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
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
      }

      // Apply rest effects if they chose to rest
      if (didRest) {
        await RestPhaseService.applyRestEffects(sessionId);
      }

      await PhaseManager.endRestPeriod(sessionId, phaseNumber, didRest);
      return { success: true };
    }),

  /**
   * Use an action during rest period (heal, use item, change equipment)
   */
  useRestAction: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        actionType: z.enum(["HEAL", "USE_ITEM", "CHANGE_EQUIPMENT"]),
        data: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, actionType, data } = input;

      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Verify user has access to this session
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: {
          party: {
            include: {
              members: {
                include: {
                  character: true,
                  npcCompanion: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
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
      }

      switch (actionType) {
        case "HEAL":
          // Rest healing is automatic when ending rest, so this is just a placeholder
          return {
            success: true,
            message: "Healing will be applied when rest ends",
          };

        case "USE_ITEM":
          const { characterId, itemId } = data;
          return await RestPhaseService.useItemDuringRest(
            sessionId,
            characterId,
            itemId
          );

        case "CHANGE_EQUIPMENT":
          const { characterId: charId, itemId: equipItemId, slot } = data;
          return await RestPhaseService.changeEquipment(
            charId,
            equipItemId,
            slot
          );

        default:
          return { success: false, message: "Unknown action type" };
      }
    }),

  /**
   * Get party health status for rest phase UI
   */
  getPartyHealthStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { sessionId } = input;

      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Verify user has access to this session
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: {
          party: {
            include: {
              members: {
                include: {
                  character: true,
                  npcCompanion: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
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
      }

      return await RestPhaseService.getPartyHealthStatus(sessionId);
    }),

  /**
   * Start the next phase (for testing/admin purposes)
   */
  startPhase: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        phaseNumber: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, phaseNumber } = input;

      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Verify user has access to this session
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: {
          party: {
            include: {
              members: {
                include: {
                  character: true,
                  npcCompanion: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
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
      }

      const phase = await PhaseManager.startPhase(sessionId, phaseNumber);
      return { success: true, phase };
    }),

  /**
   * Complete the current phase (for testing/admin purposes)
   */
  completePhase: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        phaseNumber: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, phaseNumber } = input;

      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Verify user has access to this session
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: {
          party: {
            include: {
              members: {
                include: {
                  character: true,
                  npcCompanion: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
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
      }

      await PhaseManager.completePhase(sessionId, phaseNumber);
      return { success: true };
    }),

  /**
   * Update monster health in the database
   */
  updateMonsterHealth: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        phaseNumber: z.number(),
        monsterId: z.string(),
        newHealth: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log(`💾 [PhaseRouter] updateMonsterHealth called:`, input);

      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Verify user has access to this session
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: input.sessionId },
        include: {
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

      if (!session) {
        throw new Error("Session not found");
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
      }

      // Get the phase
      const phase = await ctx.db.missionPhase.findFirst({
        where: {
          sessionId: input.sessionId,
          phaseNumber: input.phaseNumber,
        },
      });

      if (!phase) {
        throw new Error("Phase not found");
      }

      // Update monster health in the monstersSpawned array
      const monstersSpawned = (phase.monstersSpawned as any[]) || [];
      console.log(
        `🔍 [PhaseRouter] Looking for monster ${input.monsterId} in:`,
        monstersSpawned.map((m) => ({ id: m.id, name: m.name }))
      );

      const monsterIndex = monstersSpawned.findIndex(
        (m) => m.id === input.monsterId
      );

      if (monsterIndex === -1) {
        console.error(
          `❌ [PhaseRouter] Monster ${input.monsterId} not found in phase`
        );
        throw new Error("Monster not found in phase");
      }

      // Update the monster's health
      monstersSpawned[monsterIndex].health = input.newHealth;

      // Save the updated monsters to the database
      await ctx.db.missionPhase.update({
        where: { id: phase.id },
        data: { monstersSpawned },
      });

      console.log(
        `💾 [PhaseRouter] Updated monster ${input.monsterId} health to ${input.newHealth}`
      );

      return { success: true };
    }),

  /**
   * Complete mission directly (for final phase without rest period)
   */
  completeMission: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        phaseNumber: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, phaseNumber } = input;

      // Get current character
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Verify user has access to this session
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: {
          mission: true,
          party: {
            include: {
              members: {
                include: {
                  character: true,
                  npcCompanion: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
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
        // Solo session - allow access (no additional checks needed)
      }

      // Verify this is the final phase
      if (phaseNumber !== session.mission.totalPhases) {
        throw new Error("Can only complete mission on final phase");
      }

      // Mark the final phase as completed
      await ctx.db.missionPhase.updateMany({
        where: {
          sessionId,
          phaseNumber,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Complete the mission directly
      await ctx.db.dungeonSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          missionEndTime: new Date(),
        },
      });

      console.log(`🎉 [PhaseRouter] Mission completed directly!`);

      // Apply mission completion rewards
      const { RewardService } = await import("../services/rewardService");
      const { LootService } = await import("../services/lootService");

      await RewardService.applyMissionCompletionRewards(sessionId);
      console.log(`💰 [PhaseRouter] Mission completion rewards applied`);

      await LootService.generateMissionLoot(sessionId);
      console.log(`🎁 [PhaseRouter] Mission completion loot generated`);

      return { success: true };
    }),
});
