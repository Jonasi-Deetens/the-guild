import { db } from "@/lib/db";
import { wsManager } from "@/server/websocket";
import { EventGenerator } from "./eventGenerator";
import {
  getRedisClient,
  REDIS_KEYS,
  ActiveSessionState,
  setActiveSessionState,
  getActiveSessionState,
} from "@/lib/redis";
import { statisticsService } from "./statisticsService";

export interface DungeonAction {
  characterId: string;
  action: "ATTACK" | "DEFEND" | "USE_ITEM" | "FLEE" | "BETRAY" | "WAIT";
  targetId?: string;
  itemId?: string;
}

export interface DungeonResult {
  characterId: string;
  action: string;
  damage?: number;
  healing?: number;
  success: boolean;
  message: string;
}

export class DungeonEngine {
  private activeSessions = new Map<string, DungeonSession>();

  async startDungeon(sessionId: string) {
    try {
      const session = await db.dungeonSession.findUnique({
        where: { id: sessionId },
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

      if (!session) {
        throw new Error("Dungeon session not found");
      }

      if (session.status !== "WAITING") {
        throw new Error("Dungeon session is not in waiting state");
      }

      // Generate timeline
      const seed = `${sessionId}_${Date.now()}`;
      const generator = new EventGenerator(seed);
      const timeline = await generator.generateTimeline(
        sessionId,
        session.missionId,
        session.mission.difficulty
      );

      // Update session with timeline and first event
      await db.dungeonSession.update({
        where: { id: sessionId },
        data: {
          status: "ACTIVE",
          startedAt: new Date(),
          seed,
          currentEventId: timeline.startNodeId,
          timeline: timeline as any,
        },
      });

      // Store active state in Redis
      const activeState: ActiveSessionState = {
        sessionId,
        currentEventId: timeline.startNodeId,
        activePlayers: session.party.members.map((m) => m.characterId),
        turnEndsAt: Date.now() + 120000, // 2 minutes
        eventData: timeline.nodes[0].data,
      };

      await setActiveSessionState(sessionId, activeState);

      // Initialize statistics tracking
      await statisticsService.initializeDungeonStatistics(sessionId);

      // Notify all party members (if WebSocket is available)
      if (wsManager) {
        wsManager.emitToParty(session.partyId, "dungeonStarted", {
          sessionId,
          timeline,
          currentEvent: timeline.nodes[0],
        });
      }

      // Start first event
      await this.startEvent(sessionId, timeline.startNodeId);

      return { success: true };
    } catch (error) {
      console.error("Error starting dungeon:", error);
      throw error;
    }
  }

  async startSoloDungeon(sessionId: string, characterId: string) {
    try {
      const session = await db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: {
          mission: true,
        },
      });

      if (!session) {
        throw new Error("Dungeon session not found");
      }

      if (session.status !== "WAITING") {
        throw new Error("Dungeon session is not in waiting state");
      }

      // Generate timeline
      const seed = `${sessionId}_${Date.now()}`;
      const generator = new EventGenerator(seed);
      const timeline = await generator.generateTimeline(
        sessionId,
        session.missionId,
        session.mission.difficulty
      );

      // Update session with timeline and first event
      await db.dungeonSession.update({
        where: { id: sessionId },
        data: {
          status: "ACTIVE",
          startedAt: new Date(),
          seed,
          currentEventId: timeline.startNodeId,
          timeline: timeline as any,
        },
      });

      // Store active state in Redis
      const activeState: ActiveSessionState = {
        sessionId,
        currentEventId: timeline.startNodeId,
        activePlayers: [characterId],
        turnEndsAt: Date.now() + 120000, // 2 minutes
        eventData: timeline.nodes[0].data,
      };

      await setActiveSessionState(sessionId, activeState);

      // Initialize statistics tracking
      await statisticsService.initializeDungeonStatistics(sessionId);

      // Notify the character (if WebSocket is available)
      if (wsManager) {
        wsManager.emitToCharacter(characterId, "dungeonStarted", {
          sessionId,
          timeline,
          currentEvent: timeline.nodes[0],
        });
      }

      // Start first event
      await this.startEvent(sessionId, timeline.startNodeId);

      return { success: true };
    } catch (error) {
      console.error("Error starting solo dungeon:", error);
      throw error;
    }
  }

  async startTurn(sessionId: string) {
    try {
      const session = await db.dungeonSession.findUnique({
        where: { id: sessionId },
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

      if (!session) {
        throw new Error("Dungeon session not found");
      }

      const turnEndsAt = new Date(Date.now() + session.turnTimeLimit * 1000);

      // Update session with turn info
      await db.dungeonSession.update({
        where: { id: sessionId },
        data: {
          turnEndsAt,
        },
      });

      // Notify all party members (if WebSocket is available)
      if (wsManager) {
        wsManager.emitToParty(session.partyId, "turnStarted", {
          sessionId,
          turnNumber: session.currentTurn,
          timeLimit: session.turnTimeLimit,
          endsAt: turnEndsAt.toISOString(),
        });
      }

      // Set timeout to resolve turn
      setTimeout(() => {
        this.resolveTurn(sessionId);
      }, session.turnTimeLimit * 1000);

      return { success: true };
    } catch (error) {
      console.error("Error starting turn:", error);
      throw error;
    }
  }

  async submitAction(
    sessionId: string,
    characterId: string,
    action: DungeonAction
  ) {
    try {
      const session = await db.dungeonSession.findUnique({
        where: { id: sessionId },
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
        throw new Error("Dungeon session not found");
      }

      if (session.status !== "ACTIVE") {
        throw new Error("Dungeon session is not active");
      }

      // Check if character is in the party
      const partyMember = session.party.members.find(
        (member) => member.characterId === characterId
      );

      if (!partyMember) {
        throw new Error("Character is not in this party");
      }

      // Check if turn is still active
      if (session.turnEndsAt && new Date() > session.turnEndsAt) {
        throw new Error("Turn has already ended");
      }

      // Check if action already submitted for this turn
      const existingTurn = await db.dungeonTurn.findUnique({
        where: {
          sessionId_characterId_turnNumber: {
            sessionId,
            characterId,
            turnNumber: session.currentTurn,
          },
        },
      });

      if (existingTurn) {
        throw new Error("Action already submitted for this turn");
      }

      // Create dungeon turn
      await db.dungeonTurn.create({
        data: {
          sessionId,
          characterId,
          turnNumber: session.currentTurn,
          action: action.action,
          targetId: action.targetId,
          itemId: action.itemId,
        },
      });

      // Check if all party members have submitted actions
      const submittedActions = await db.dungeonTurn.count({
        where: {
          sessionId,
          turnNumber: session.currentTurn,
        },
      });

      const totalMembers = session.party.members.length;

      if (submittedActions >= totalMembers) {
        // All actions submitted, resolve turn immediately
        await this.resolveTurn(sessionId);
      }

      return { success: true };
    } catch (error) {
      console.error("Error submitting action:", error);
      throw error;
    }
  }

  async resolveTurn(sessionId: string) {
    try {
      const session = await db.dungeonSession.findUnique({
        where: { id: sessionId },
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
            where: {
              turnNumber: session?.currentTurn,
            },
            include: {
              character: true,
            },
          },
        },
      });

      if (!session) {
        throw new Error("Dungeon session not found");
      }

      const results: DungeonResult[] = [];

      // Process each action
      for (const turn of session.turns) {
        const result = await this.processAction(turn, session);
        results.push(result);

        // Update character stats if needed
        if (result.damage || result.healing) {
          await this.updateCharacterStats(turn.characterId, result);
        }
      }

      // Mark all turns as resolved
      await db.dungeonTurn.updateMany({
        where: {
          sessionId,
          turnNumber: session.currentTurn,
        },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      });

      // Check win/lose conditions
      const winCondition = await this.checkWinCondition(sessionId);
      const loseCondition = await this.checkLoseCondition(sessionId);

      if (winCondition || loseCondition) {
        await this.endDungeon(sessionId, winCondition);
      } else {
        // Continue to next turn
        await this.nextTurn(sessionId);
      }

      // Notify all party members (if WebSocket is available)
      if (wsManager) {
        wsManager.emitToParty(session.partyId, "turnEnded", {
          sessionId,
          results,
        });
      }

      return { success: true, results };
    } catch (error) {
      console.error("Error resolving turn:", error);
      throw error;
    }
  }

  private async processAction(turn: any, session: any): Promise<DungeonResult> {
    const character = turn.character;
    let result: DungeonResult = {
      characterId: character.id,
      action: turn.action,
      success: true,
      message: "",
    };

    switch (turn.action) {
      case "ATTACK":
        if (turn.targetId) {
          const target = session.party.members.find(
            (member: any) => member.characterId === turn.targetId
          );
          if (target) {
            const damage = this.calculateDamage(character, target.character);
            result.damage = damage;
            result.message = `${character.name} attacks ${target.character.name} for ${damage} damage`;
          }
        }
        break;

      case "DEFEND":
        result.message = `${character.name} takes a defensive stance`;
        break;

      case "USE_ITEM":
        if (turn.itemId) {
          const item = await db.item.findUnique({
            where: { id: turn.itemId },
          });
          if (item && item.healing) {
            result.healing = item.healing;
            result.message = `${character.name} uses ${item.name} and heals for ${item.healing} HP`;
          }
        }
        break;

      case "FLEE":
        result.message = `${character.name} attempts to flee`;
        // Add flee logic here
        break;

      case "BETRAY":
        if (turn.targetId) {
          const target = session.party.members.find(
            (member: any) => member.characterId === turn.targetId
          );
          if (target) {
            const damage =
              this.calculateDamage(character, target.character) * 1.5; // Betrayal bonus
            result.damage = Math.floor(damage);
            result.message = `${character.name} betrays ${target.character.name} for ${result.damage} damage!`;
          }
        }
        break;

      case "WAIT":
        result.message = `${character.name} waits`;
        break;
    }

    return result;
  }

  private calculateDamage(attacker: any, defender: any): number {
    const baseDamage = attacker.attack || 10;
    const defense = defender.defense || 5;
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier

    const damage = Math.max(
      1,
      Math.floor((baseDamage - defense) * randomFactor)
    );
    return damage;
  }

  private async updateCharacterStats(
    characterId: string,
    result: DungeonResult
  ) {
    const updates: any = {};

    if (result.damage) {
      updates.health = {
        decrement: result.damage,
      };
    }

    if (result.healing) {
      updates.health = {
        increment: result.healing,
      };
    }

    if (Object.keys(updates).length > 0) {
      await db.character.update({
        where: { id: characterId },
        data: updates,
      });
    }
  }

  private async checkWinCondition(sessionId: string): Promise<boolean> {
    // Implement win conditions based on mission type
    // For now, simple turn-based win condition
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
    });

    return session ? session.currentTurn >= session.maxTurns : false;
  }

  private async checkLoseCondition(sessionId: string): Promise<boolean> {
    // Check if all party members are dead
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
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

    if (!session) return false;

    const aliveMembers = session.party.members.filter(
      (member) => member.character.health > 0
    );

    return aliveMembers.length === 0;
  }

  private async nextTurn(sessionId: string) {
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        currentTurn: {
          increment: 1,
        },
        turnEndsAt: null,
      },
    });

    // Start next turn
    await this.startTurn(sessionId);
  }

  private async endDungeon(sessionId: string, success: boolean) {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        mission: true,
        events: {
          include: {
            playerActions: {
              include: {
                character: true,
              },
            },
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

    if (!session) return;

    console.log("🎯 endDungeon called:", {
      sessionId,
      success,
      hasParty: !!session.party,
      hasEvents: !!session.events,
      eventsCount: session.events?.length || 0,
    });

    // Update session status
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        status: success ? "COMPLETED" : "FAILED",
        completedAt: new Date(),
      },
    });

    // Generate loot if successful
    let loot = [];
    if (success) {
      loot = await this.generateLoot(sessionId, session.mission);
    }

    // Award experience and gold
    if (success) {
      await this.awardRewards(sessionId, session.mission);
    }

    // Notify players (if WebSocket is available)
    if (wsManager) {
      if (session.partyId) {
        // Party mission
        wsManager.emitToParty(session.partyId, "dungeonCompleted", {
          sessionId,
          success,
          loot,
        });
      } else {
        // Solo mission - notify character directly
        const activeState = await getActiveSessionState(sessionId);
        if (activeState && activeState.activePlayers.length > 0) {
          wsManager.emitToCharacter(
            activeState.activePlayers[0],
            "dungeonCompleted",
            {
              sessionId,
              success,
              loot,
            }
          );
        }
      }
    }

    // Finalize dungeon statistics
    await statisticsService.finalizeDungeonStatistics(sessionId, success);

    // Update character statistics for all participants
    const dungeonStats = await statisticsService.getDungeonStatistics(
      sessionId
    );
    if (dungeonStats) {
      let participants = [];

      if (session.party?.members) {
        // Party mission
        participants = session.party.members;
      } else {
        // Solo mission - get character from events
        if (session.events && session.events.length > 0) {
          const characterActions = session.events
            .flatMap((event: any) => event.playerActions || [])
            .map((action: any) => action.character)
            .filter((char: any) => char); // Filter out null/undefined characters

          if (characterActions.length > 0) {
            const soloCharacter = characterActions[0];
            participants = [{ characterId: soloCharacter.id }];
          }
        }
      }

      console.log(
        "📊 Updating character statistics for participants:",
        participants.length
      );

      for (const member of participants) {
        console.log("📊 Updating character stats for:", member.characterId);
        await statisticsService.updateCharacterStatistics(member.characterId, {
          success,
          timeSpent: dungeonStats.totalTimeSpent,
          goldEarned: dungeonStats.goldEarned,
          experienceGained: dungeonStats.experienceGained,
          levelsGained: dungeonStats.levelsGained,
          enemiesDefeated: dungeonStats.enemiesDefeated,
          damageDealt: dungeonStats.damageDealt,
          damageTaken: dungeonStats.damageTaken,
          timesFled: dungeonStats.timesFled,
          itemsFound: dungeonStats.itemsFound,
          chestsOpened: dungeonStats.chestsOpened,
        });
      }
    }

    // Update party status (only for party missions)
    if (session.partyId) {
      await db.party.update({
        where: { id: session.partyId },
        data: { status: "COMPLETED" },
      });
    }
  }

  private async generateLoot(sessionId: string, mission: any) {
    // Simple loot generation - create some basic items
    const lootItems = [
      {
        name: "Health Potion",
        description:
          "A magical potion that restores 20 health points when consumed.",
        type: "CONSUMABLE",
        healing: 20,
        value: 50,
      },
      {
        name: "Iron Sword",
        description: "A sturdy iron sword that increases attack power by 15.",
        type: "WEAPON",
        attack: 15,
        value: 100,
      },
      {
        name: "Leather Armor",
        description: "Light leather armor that provides 10 points of defense.",
        type: "ARMOR",
        defense: 10,
        value: 75,
      },
    ];

    const loot = [];
    for (const itemData of lootItems) {
      const item = await db.item.create({
        data: itemData,
      });

      await db.dungeonLoot.create({
        data: {
          sessionId,
          itemId: item.id,
          quantity: 1,
        },
      });

      loot.push(item);
    }

    return loot;
  }

  private async awardRewards(sessionId: string, mission: any) {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
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

    if (!session) return;

    if (session.party) {
      // Party mission - award to all party members
      for (const member of session.party.members) {
        await db.character.update({
          where: { id: member.characterId },
          data: {
            gold: {
              increment: mission.baseReward,
            },
            experience: {
              increment: mission.experienceReward,
            },
          },
        });
      }
    } else {
      // Solo mission - award to the character who participated
      const characterActions = session.events
        .flatMap((event) => event.playerActions)
        .map((action) => action.character);

      const soloCharacter = characterActions[0];
      if (soloCharacter) {
        await db.character.update({
          where: { id: soloCharacter.id },
          data: {
            gold: {
              increment: mission.baseReward,
            },
            experience: {
              increment: mission.experienceReward,
            },
          },
        });
      }
    }
  }

  // New event-based methods
  async startEvent(sessionId: string, eventId: string) {
    const event = await db.dungeonEvent.findUnique({
      where: { id: eventId },
      include: { template: true, session: { include: { party: true } } },
    });

    if (!event) throw new Error("Event not found");

    // Update event status
    await db.dungeonEvent.update({
      where: { id: eventId },
      data: {
        status: "ACTIVE",
        startsAt: new Date(),
      },
    });

    // Set turn timer in Redis
    const redis = await getRedisClient();
    const turnEndsAt =
      Date.now() + (event.template?.config?.timeLimit || 120) * 1000;

    await redis.set(REDIS_KEYS.turnTimer(eventId), turnEndsAt.toString(), {
      EX: 300,
    });

    // Notify players (if WebSocket is available)
    if (wsManager) {
      if (event.session.partyId) {
        wsManager.emitToParty(event.session.partyId, "eventStarted", {
          eventId,
          type: event.template?.type,
          data: event.eventData,
          timeLimit: event.template?.config?.timeLimit || 120,
          endsAt: turnEndsAt,
        });
      } else {
        // Solo dungeon - notify the character directly
        const activeState = await getActiveSessionState(event.sessionId);
        if (activeState && activeState.activePlayers.length > 0) {
          wsManager.emitToCharacter(
            activeState.activePlayers[0],
            "eventStarted",
            {
              eventId,
              type: event.template?.type,
              data: event.eventData,
              timeLimit: event.template?.config?.timeLimit || 120,
              endsAt: turnEndsAt,
            }
          );
        }
      }
    }

    // Schedule auto-resolution
    setTimeout(() => {
      this.resolveEvent(eventId);
    }, (event.template?.config?.timeLimit || 120) * 1000);
  }

  async submitEventAction(
    eventId: string,
    characterId: string,
    actionType: string,
    actionData: any
  ) {
    console.log("🎮 Submitting event action:", {
      eventId,
      characterId,
      actionType,
      actionData,
    });
    // Check if already submitted
    const existing = await db.dungeonPlayerAction.findUnique({
      where: { eventId_characterId: { eventId, characterId } },
    });

    if (existing) {
      console.log("🎮 Action already submitted, skipping");
      throw new Error("Action already submitted");
    }

    console.log("🎮 Creating new action in database");
    // Create action
    const action = await db.dungeonPlayerAction.create({
      data: {
        eventId,
        characterId,
        actionType,
        actionData,
      },
    });

    console.log("🎮 Action created successfully:", action.id);

    // Check if all players submitted
    const event = await db.dungeonEvent.findUnique({
      where: { id: eventId },
      include: {
        playerActions: true,
        session: {
          include: {
            party: { include: { members: true } },
          },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    // Handle solo dungeons (no party)
    if (!event.session.party) {
      console.log("🎯 Solo dungeon - resolving event immediately");
      // Solo dungeon - resolve immediately after one action
      await this.resolveEvent(eventId);
      return;
    }

    const totalPlayers = event.session.party.members.length;
    const submittedActions = event.playerActions.length + 1; // +1 for the action we just created

    console.log("🎯 Party dungeon - checking if all players submitted:", {
      totalPlayers,
      submittedActions,
      shouldResolve: submittedActions >= totalPlayers,
    });

    if (submittedActions >= totalPlayers) {
      // All submitted, resolve immediately
      console.log("🎯 All players submitted - resolving event");
      await this.resolveEvent(eventId);
    } else {
      console.log("🎯 Waiting for more players to submit actions");
      // Notify others (if WebSocket is available)
      if (wsManager) {
        wsManager.emitToParty(event.session.partyId, "playerActed", {
          eventId,
          characterId,
          actionsRemaining: totalPlayers - submittedActions,
        });
      }
    }
  }

  async resolveEvent(eventId: string) {
    console.log("🎯 Resolving event:", eventId);

    const event = await db.dungeonEvent.findUnique({
      where: { id: eventId },
      include: {
        template: true,
        playerActions: { include: { character: true } },
        session: {
          include: { party: { include: { members: true } }, mission: true },
        },
      },
    });

    if (!event || event.status === "COMPLETED") {
      console.log("🎯 Event not found or already completed:", {
        eventId,
        found: !!event,
        status: event?.status,
      });
      return;
    }

    // Process event based on type
    console.log("🎲 Processing event type:", event.template?.type);
    const results = await this.processEventType(event);
    console.log("🎲 Event results:", results);

    // Update event
    await db.dungeonEvent.update({
      where: { id: eventId },
      data: {
        status: "COMPLETED",
        results,
        completedAt: new Date(),
      },
    });

    // Update character stats (health, gold, etc.)
    await this.applyEventResults(results, event);

    // Notify players (if WebSocket is available)
    if (wsManager) {
      if (event.session.partyId) {
        wsManager.emitToParty(event.session.partyId, "eventCompleted", {
          eventId,
          results,
        });
      } else {
        // Solo dungeon - notify the character directly
        const activeState = await getActiveSessionState(event.sessionId);
        if (activeState && activeState.activePlayers.length > 0) {
          wsManager.emitToCharacter(
            activeState.activePlayers[0],
            "eventCompleted",
            {
              eventId,
              results,
            }
          );
        }
      }
    }

    // Update statistics for this event
    const eventStartTime = event.createdAt.getTime();
    const eventEndTime = Date.now();
    const timeSpent = Math.round((eventEndTime - eventStartTime) / 1000);

    console.log("📊 About to update statistics:", {
      sessionId: event.sessionId,
      eventType: event.template?.type || "UNKNOWN",
      success: results.success !== false,
      timeSpent,
      results,
    });

    await statisticsService.updateDungeonEventStats(event.sessionId, {
      eventType: event.template?.type || "UNKNOWN",
      success: results.success !== false, // Default to success unless explicitly failed
      timeSpent,
      results,
    });

    // Determine next event (branching logic)
    const nextEventId = await this.selectNextEvent(event, results);

    if (nextEventId) {
      // Continue to next event
      await this.startEvent(event.sessionId, nextEventId);
    } else {
      // End of timeline - check win conditions
      await this.endDungeon(event.sessionId, true);
    }
  }

  private async processEventType(event: any): Promise<any> {
    switch (event.template?.type) {
      case "COMBAT":
        return await this.processCombatEvent(event);
      case "TREASURE":
        return await this.processTreasureEvent(event);
      case "TRAP":
        return await this.processTrapEvent(event);
      case "PUZZLE":
        return await this.processPuzzleEvent(event);
      case "CHOICE":
        return await this.processChoiceEvent(event);
      case "BOSS":
        return await this.processBossEvent(event);
      case "NPC_ENCOUNTER":
        return await this.processNpcEvent(event);
      case "ENVIRONMENTAL_HAZARD":
        return await this.processHazardEvent(event);
      default:
        return {};
    }
  }

  private async processCombatEvent(event: any): Promise<any> {
    // Implement contextual combat AI
    // Enemies react to betrayals, target based on actions, etc.
    // Return damage/healing/loot results
    const results = {
      type: "combat",
      damageDealt: {},
      damageTaken: {},
      enemiesDefeated: 0,
      experience: {},
      gold: {},
      itemsFound: 0,
    };

    // Process each player action
    for (const action of event.playerActions) {
      if (action.actionType === "ATTACK") {
        // Calculate damage based on character stats and target
        const damage = this.calculateDamage(
          action.character,
          action.actionData.target
        );
        results.damageDealt[action.characterId] = damage;
        results.enemiesDefeated += 1; // Assume each attack defeats an enemy
        results.experience[action.characterId] =
          (results.experience[action.characterId] || 0) + 20;
      } else if (action.actionType === "DEFEND") {
        // Reduce incoming damage
        results.damageTaken[action.characterId] = 5; // Some damage taken while defending
        results.experience[action.characterId] =
          (results.experience[action.characterId] || 0) + 10;
      } else if (action.actionType === "FLEE") {
        results.fled = true;
        results.experience[action.characterId] =
          (results.experience[action.characterId] || 0) + 5;
      }
    }

    return results;
  }

  private async processTreasureEvent(event: any): Promise<any> {
    const results = {
      type: "treasure",
      gold: {},
      experience: {},
      itemsFound: 0,
      chestsOpened: 0,
    };

    // Process treasure collection
    for (const action of event.playerActions) {
      if (action.actionType === "COLLECT") {
        const goldAmount = 50 + Math.floor(Math.random() * 50);
        results.gold[action.characterId] = goldAmount;
        results.experience[action.characterId] =
          (results.experience[action.characterId] || 0) + 15;
        results.itemsFound += 1;
        results.chestsOpened += 1;
      }
    }

    return results;
  }

  private async processTrapEvent(event: any): Promise<any> {
    const results = {
      type: "trap",
      damageTaken: {},
      experience: {},
    };

    // Process trap avoidance
    for (const action of event.playerActions) {
      if (action.actionType === "AVOID") {
        // Success based on character perception
        const success = action.character.perception > 3;
        if (!success) {
          results.damageTaken[action.characterId] = 20;
        }
        results.experience[action.characterId] =
          (results.experience[action.characterId] || 0) + (success ? 20 : 5);
      }
    }

    return results;
  }

  private async processPuzzleEvent(event: any): Promise<any> {
    const results = {
      type: "puzzle",
      experience: 0,
      rewards: {},
    };

    // Process puzzle solving
    for (const action of event.playerActions) {
      if (action.actionType === "SOLVE") {
        const success = action.actionData.solution === "correct";
        results.experience += success ? 40 : 10;
        if (success) {
          results.rewards[action.characterId] = { gold: 75 };
        }
      }
    }

    return results;
  }

  private async processChoiceEvent(event: any): Promise<any> {
    const results = {
      type: "choice",
      reputation: {},
      experience: 0,
    };

    // Process moral choices
    for (const action of event.playerActions) {
      const choice = action.actionData.choice;
      if (choice === "help") {
        results.reputation[action.characterId] = 10;
        results.experience += 25;
      } else if (choice === "ignore") {
        results.reputation[action.characterId] = 0;
        results.experience += 10;
      } else if (choice === "harm") {
        results.reputation[action.characterId] = -10;
        results.experience += 15;
      }
    }

    return results;
  }

  private async processBossEvent(event: any): Promise<any> {
    const results = {
      type: "boss",
      damage: {},
      healing: {},
      experience: 0,
      victory: false,
    };

    // Process boss fight
    let totalDamage = 0;
    for (const action of event.playerActions) {
      if (action.actionType === "ATTACK") {
        const damage = this.calculateDamage(action.character, null);
        totalDamage += damage;
        results.damage[action.characterId] = damage;
      }
    }

    // Check if boss is defeated
    const bossHealth = event.eventData.health || 100;
    if (totalDamage >= bossHealth) {
      results.victory = true;
      results.experience = 100;
    }

    return results;
  }

  private async processNpcEvent(event: any): Promise<any> {
    const results = {
      type: "npc",
      experience: 0,
      rewards: {},
    };

    // Process NPC interaction
    for (const action of event.playerActions) {
      if (action.actionType === "TALK") {
        results.experience += 20;
        results.rewards[action.characterId] = { gold: 50 };
      }
    }

    return results;
  }

  private async processHazardEvent(event: any): Promise<any> {
    const results = {
      type: "hazard",
      damage: {},
      experience: 0,
    };

    // Process hazard avoidance
    for (const action of event.playerActions) {
      if (action.actionType === "AVOID") {
        const success = action.character.speed > 4;
        if (!success) {
          results.damage[action.characterId] = 15;
        }
        results.experience += success ? 30 : 8;
      }
    }

    return results;
  }

  private async applyEventResults(results: any, event: any) {
    console.log("🎯 Applying event results:", results);

    // Apply damage taken to characters (damageTaken is damage received)
    for (const [characterId, damage] of Object.entries(
      results.damageTaken || {}
    )) {
      await db.character.update({
        where: { id: characterId },
        data: { health: { decrement: damage as number } },
      });
    }

    // Note: damageDealt is damage dealt to enemies, not healing
    // Healing would be a separate property if we implement it

    // Apply gold rewards
    for (const [characterId, gold] of Object.entries(results.gold || {})) {
      await db.character.update({
        where: { id: characterId },
        data: { gold: { increment: gold as number } },
      });
    }

    // Apply experience and handle leveling
    if (results.experience && event.playerActions.length > 0) {
      console.log("🎯 Distributing experience:", results.experience);
      // results.experience is now an object with character IDs as keys
      for (const action of event.playerActions) {
        const characterXP = results.experience[action.characterId] || 0;
        console.log("🎯 Character XP:", {
          characterId: action.characterId,
          xp: characterXP,
        });
        if (characterXP > 0) {
          await this.applyExperienceAndLevelUp(action.characterId, characterXP);
        }
      }
    }
  }

  private async selectNextEvent(
    event: any,
    results: any
  ): Promise<string | null> {
    // Check child events (branches)
    const children = await db.dungeonEvent.findMany({
      where: { parentEventId: event.id },
    });

    if (children.length === 0) {
      // Linear path - next event by number
      const nextEvent = await db.dungeonEvent.findFirst({
        where: {
          sessionId: event.sessionId,
          eventNumber: event.eventNumber + 1,
          parentEventId: null,
        },
      });
      return nextEvent?.id || null;
    }

    // Branching - select based on results
    // Example: if fled, take escape route; if fought, continue main path
    const selectedBranch = this.evaluateBranchCondition(children, results);
    return selectedBranch?.id || null;
  }

  private evaluateBranchCondition(children: any[], results: any): any {
    // Simple branching logic - can be expanded
    if (results.type === "combat" && results.victory) {
      return children.find((c) => c.template?.type === "TREASURE");
    } else if (results.type === "choice" && results.reputation) {
      return children.find((c) => c.template?.type === "NPC_ENCOUNTER");
    }

    // Default to first child
    return children[0];
  }

  private async applyExperienceAndLevelUp(
    characterId: string,
    experience: number
  ) {
    console.log("🎯 Applying experience and level up:", {
      characterId,
      experience,
    });

    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      console.log("🎯 Character not found:", characterId);
      return;
    }

    // Ensure experience is a valid number
    const validExperience = isNaN(experience) ? 0 : experience;
    const newExperience = (character.experience || 0) + validExperience;
    const newLevel = this.calculateLevel(newExperience);
    const leveledUp = newLevel > (character.level || 1);

    console.log("🎯 Experience calculation:", {
      currentExperience: character.experience,
      experienceToAdd: validExperience,
      newExperience,
      currentLevel: character.level,
      newLevel,
      leveledUp,
    });

    // Calculate stat increases if leveled up
    let statIncreases = {};
    if (leveledUp) {
      const levelsGained = newLevel - character.level;
      statIncreases = this.calculateStatIncreases(
        levelsGained,
        character.level
      );
    }

    // Update character
    await db.character.update({
      where: { id: characterId },
      data: {
        experience: newExperience,
        level: newLevel,
        ...statIncreases,
      },
    });

    // Notify player if they leveled up
    if (leveledUp && wsManager) {
      wsManager.emitToCharacter(characterId, "characterLeveledUp", {
        newLevel,
        statIncreases,
        totalExperience: newExperience,
      });
    }
  }

  private calculateLevel(experience: number): number {
    // Experience formula: level = floor(sqrt(experience / 100)) + 1
    // This means:
    // Level 1: 0-99 XP
    // Level 2: 100-399 XP
    // Level 3: 400-899 XP
    // Level 4: 900-1599 XP
    // etc.
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  private calculateStatIncreases(levelsGained: number, currentLevel: number) {
    // Each level gives:
    // +2 to max health
    // +1 to attack
    // +1 to defense
    // +0.5 to speed (rounded down, so every 2 levels = +1)
    // +0.5 to perception (rounded down, so every 2 levels = +1)

    const healthIncrease = levelsGained * 2;
    const attackIncrease = levelsGained;
    const defenseIncrease = levelsGained;
    const speedIncrease = Math.floor(levelsGained * 0.5);
    const perceptionIncrease = Math.floor(levelsGained * 0.5);

    return {
      maxHealth: { increment: healthIncrease },
      health: { increment: healthIncrease }, // Also heal the character
      attack: { increment: attackIncrease },
      defense: { increment: defenseIncrease },
      speed: { increment: speedIncrease },
      perception: { increment: perceptionIncrease },
    };
  }

  // Give items to characters (for rewards, starting gear, etc.)
  async giveItemToCharacter(
    characterId: string,
    itemId: string,
    quantity: number = 1
  ) {
    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const item = await db.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error("Item not found");
    }

    // Check if character already has this item
    const existingInventory = await db.inventory.findUnique({
      where: {
        characterId_itemId: {
          characterId,
          itemId,
        },
      },
    });

    if (existingInventory) {
      // Update quantity if item is stackable
      if (item.isStackable) {
        await db.inventory.update({
          where: { id: existingInventory.id },
          data: { quantity: { increment: quantity } },
        });
      } else {
        // Create new inventory entry for non-stackable items
        await db.inventory.create({
          data: {
            characterId,
            itemId,
            quantity,
          },
        });
      }
    } else {
      // Create new inventory entry
      await db.inventory.create({
        data: {
          characterId,
          itemId,
          quantity,
        },
      });
    }

    return { success: true, message: `Received ${quantity}x ${item.name}` };
  }

  // Give starting items to new characters
  async giveStartingItems(characterId: string) {
    // Get some basic starting items
    const startingItems = await db.item.findMany({
      where: {
        name: {
          in: ["Rusty Sword", "Leather Jerkin", "Health Potion", "Bandage"],
        },
      },
    });

    for (const item of startingItems) {
      const quantity =
        item.name === "Health Potion" ? 3 : item.name === "Bandage" ? 5 : 1;
      await this.giveItemToCharacter(characterId, item.id, quantity);
    }

    return { success: true, message: "Starting items received!" };
  }
}

export const dungeonEngine = new DungeonEngine();
