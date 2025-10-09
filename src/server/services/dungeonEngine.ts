import { db } from "@/lib/db";
import { wsManager } from "@/server/websocket";

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

      // Update session status
      await db.dungeonSession.update({
        where: { id: sessionId },
        data: {
          status: "ACTIVE",
          startedAt: new Date(),
          currentTurn: 1,
        },
      });

      // Notify all party members
      wsManager.emitToParty(session.partyId, "dungeonStarted", {
        sessionId,
        missionName: session.mission.name,
        turnTimeLimit: session.turnTimeLimit,
      });

      // Start first turn
      await this.startTurn(sessionId);

      return { success: true };
    } catch (error) {
      console.error("Error starting dungeon:", error);
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

      // Notify all party members
      wsManager.emitToParty(session.partyId, "turnStarted", {
        sessionId,
        turnNumber: session.currentTurn,
        timeLimit: session.turnTimeLimit,
        endsAt: turnEndsAt.toISOString(),
      });

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

      // Notify all party members
      wsManager.emitToParty(session.partyId, "turnEnded", {
        sessionId,
        results,
      });

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

    // Notify all party members
    wsManager.emitToParty(session.partyId, "dungeonCompleted", {
      sessionId,
      success,
      loot,
    });

    // Update party status
    await db.party.update({
      where: { id: session.partyId },
      data: { status: "COMPLETED" },
    });
  }

  private async generateLoot(sessionId: string, mission: any) {
    // Simple loot generation - create some basic items
    const lootItems = [
      { name: "Health Potion", type: "CONSUMABLE", healing: 20, value: 50 },
      { name: "Iron Sword", type: "WEAPON", attack: 15, value: 100 },
      { name: "Leather Armor", type: "ARMOR", defense: 10, value: 75 },
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
      },
    });

    if (!session) return;

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
  }
}

export const dungeonEngine = new DungeonEngine();
