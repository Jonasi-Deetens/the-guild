import { db } from "@/lib/db";
import { LootService } from "./lootService";
import { RewardService } from "./rewardService";
import { NPCAiService } from "./npcAiService";

interface CombatState {
  monsters: any[];
  turnCount: number;
  playerDamageDealt: number;
  enemyDamageDealt: number | Record<string, number>;
  monstersDefeated: number;
  partyHealthUpdates: Record<string, number>;
}

interface CombatResult {
  success: boolean;
  message: string;
  damage: number;
  isCritical: boolean;
  victory?: boolean;
  defeat?: boolean;
  combatState: CombatState;
  minigameResult?: any;
  generatedLoot?: any[];
  silent?: boolean;
  npcResults?: CombatResult[];
}

export class CombatService {
  /**
   * Main combat action processor
   * Handles all combat-related actions including minigame completion
   */
  static async processCombatAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<CombatResult> {
    const eventData = event.eventData as any;

    // Get or initialize combat state
    let combatState: CombatState = eventData.combatState || {
      enemies: Array.from({ length: eventData.enemyCount || 1 }, (_, i) => ({
        id: i,
        health: 100,
        maxHealth: 100,
      })),
      turnCount: 0,
      playerDamageDealt: 0,
      enemyDamageDealt: 0,
      monstersDefeated: 0,
      partyHealthUpdates: {},
    };

    // Increment turn count
    combatState.turnCount++;

    const damage = this.calculateDamage(character, eventData.enemyLevel || 1);

    // Handle different action types
    if (
      action === "attack" ||
      action === "MINIGAME_COMPLETE" ||
      action === "COMBAT_STATE_UPDATE"
    ) {
      let finalDamage = 0;
      let isCritical = false;
      let message = "";

      // Handle minigame completion
      if (action === "MINIGAME_COMPLETE" && actionData) {
        console.log(`🎯 [CombatService] MINIGAME_COMPLETE action received:`, {
          action,
          hasActionData: !!actionData,
          hasMinigameResult: !!actionData.minigameResult,
          actionDataStructure: {
            victory: actionData.victory,
            monstersDefeated: actionData.monstersDefeated,
            hasMonsters: !!actionData.monsters,
            monstersLength: actionData.monsters?.length,
          },
        });

        const minigameResult = actionData.minigameResult || actionData;

        if (minigameResult.victory) {
          console.log(`🎯 [CombatService] Victory detected:`, {
            victory: minigameResult.victory,
            monstersDefeated: minigameResult.monstersDefeated,
            hasMonsters: !!minigameResult.monsters,
            monstersLength: minigameResult.monsters?.length,
          });

          // Store full combat state
          const updatedCombatState: CombatState = {
            monsters: minigameResult.monsters || combatState.monsters || [],
            turnCount: combatState.turnCount + 1,
            playerDamageDealt:
              combatState.playerDamageDealt + (minigameResult.damageDealt || 0),
            enemyDamageDealt:
              combatState.enemyDamageDealt + (minigameResult.damageTaken || 0),
            monstersDefeated: minigameResult.monstersDefeated || 0,
            partyHealthUpdates: minigameResult.partyHealthUpdates || {},
          };

          // Persist combat state
          await this.updateCombatState(
            event.id,
            event.eventData,
            updatedCombatState
          );

          // Generate loot for defeated monsters
          const generatedLoot = await this.generateCombatLoot(
            minigameResult.monsters || [],
            event.sessionId
          );

          console.log(
            `🎁 [CombatService] Total loot generated:`,
            generatedLoot
          );

          return {
            success: true,
            message: "Victory! All enemies defeated!",
            damage: minigameResult.damageDealt || 0,
            isCritical: false,
            victory: true,
            combatState: updatedCombatState,
            minigameResult: minigameResult,
            generatedLoot: generatedLoot,
          };
        } else {
          // Defeat case
          const updatedCombatState: CombatState = {
            monsters: minigameResult.monsters || combatState.monsters || [],
            turnCount: combatState.turnCount + 1,
            playerDamageDealt:
              combatState.playerDamageDealt + (minigameResult.damageDealt || 0),
            enemyDamageDealt:
              combatState.enemyDamageDealt + (minigameResult.damageTaken || 0),
            monstersDefeated: minigameResult.monstersDefeated || 0,
            partyHealthUpdates: minigameResult.partyHealthUpdates || {},
          };

          await this.updateCombatState(
            event.id,
            event.eventData,
            updatedCombatState
          );

          // Apply damage to character
          if (minigameResult.damageTaken) {
            const characterDamage =
              minigameResult.damageTaken[character.id] || 0;
            if (characterDamage > 0) {
              await RewardService.applyEventRewards(
                event.sessionId,
                event.id,
                character.id,
                {
                  healthChange: -characterDamage,
                }
              );
            }
          }

          return {
            success: false,
            message: "Defeat! You have been defeated in combat!",
            damage: 0,
            isCritical: false,
            defeat: true,
            combatState: updatedCombatState,
            minigameResult: minigameResult,
          };
        }
      } else if (action === "COMBAT_STATE_UPDATE" && actionData) {
        // Silent combat state update (no action logging)
        console.log("💾 [CombatService] Processing silent combat state update");

        const updatedCombatState = actionData.combatState;

        await this.updateCombatState(
          event.id,
          event.eventData,
          updatedCombatState
        );

        return {
          success: true,
          message: "Combat state updated silently",
          damage: 0,
          isCritical: false,
          combatState: updatedCombatState,
          silent: true,
        };
      } else {
        // Direct attack action
        isCritical = Math.random() < character.criticalChance;
        finalDamage = isCritical ? damage * 2 : damage;
        message = isCritical
          ? `Critical hit! Dealt ${finalDamage} damage!`
          : `Dealt ${finalDamage} damage!`;
      }

      // Find the first alive enemy to attack
      const targetEnemy = combatState.monsters?.find(
        (enemy: any) => enemy.health > 0
      );

      if (targetEnemy) {
        targetEnemy.health -= finalDamage;
        combatState.playerDamageDealt += finalDamage;

        // Check if all enemies are defeated
        const aliveEnemies = combatState.monsters?.filter(
          (enemy: any) => enemy.health > 0
        );
        if (aliveEnemies.length === 0) {
          return {
            success: true,
            message: message + " Victory!",
            damage: finalDamage,
            isCritical: isCritical,
            victory: true,
            combatState: combatState,
          };
        }
      }

      // Process NPC actions after player action
      const npcResults = await this.processNPCActions(event, combatState);

      // Combine NPC results into the main result
      const npcMessages = npcResults
        .map((result) => result.message)
        .filter(Boolean);
      const totalNPCDamage = npcResults.reduce(
        (sum, result) => sum + result.damage,
        0
      );

      const combinedMessage =
        npcMessages.length > 0
          ? `${message} ${npcMessages.join(" ")}`
          : message;

      return {
        success: true,
        message: combinedMessage,
        damage: finalDamage + totalNPCDamage,
        isCritical: isCritical,
        combatState: combatState,
        npcResults: npcResults,
      };
    } else if (action === "block") {
      // Character blocks - reduce incoming damage
      const enemyDamage = Math.floor(damage * 0.3);
      combatState.enemyDamageDealt =
        (combatState.enemyDamageDealt as number) + enemyDamage;

      return {
        success: true,
        message: `Blocked the attack! Took ${enemyDamage} damage.`,
        damage: enemyDamage,
        isCritical: false,
        combatState: combatState,
      };
    } else if (action === "flee") {
      // Character flees
      const fleeChance = 0.7;
      const success = Math.random() < fleeChance;

      return {
        success: success,
        message: success ? "Successfully fled from combat!" : "Failed to flee!",
        damage: 0,
        isCritical: false,
        combatState: combatState,
      };
    }

    return {
      success: false,
      message: "Invalid combat action",
      damage: 0,
      isCritical: false,
      combatState: combatState,
    };
  }

  /**
   * Generate loot for defeated monsters
   */
  static async generateCombatLoot(
    monsters: Array<{
      id?: string;
      name?: string;
      health: number;
      templateId?: string;
      rarity?: string;
    }>,
    sessionId: string
  ): Promise<any[]> {
    const allLoot: any[] = [];

    if (!monsters || monsters.length === 0) {
      console.log(
        `⚠️ [CombatService] No monsters provided for loot generation`
      );
      return allLoot;
    }

    console.log(
      `🎁 [CombatService] Generating loot for ${monsters.length} monsters`
    );

    for (const monster of monsters) {
      if (monster.health <= 0 && monster.templateId) {
        console.log(
          `🎯 [CombatService] Generating loot for dead monster: ${monster.name} (templateId: ${monster.templateId})`
        );
        try {
          const loot = await LootService.generateLoot(
            monster.templateId,
            monster.rarity || "COMMON",
            sessionId
          );
          console.log(
            `🎁 [CombatService] Generated loot for ${monster.name}:`,
            loot
          );
          allLoot.push(...loot);
        } catch (error) {
          console.error(
            `❌ [CombatService] Failed to generate loot for monster ${monster.id}:`,
            error
          );
        }
      } else {
        console.log(
          `⚠️ [CombatService] Skipping monster ${monster.name}: health=${monster.health}, templateId=${monster.templateId}`
        );
      }
    }

    return allLoot;
  }

  /**
   * Update combat state in database
   */
  static async updateCombatState(
    eventId: string,
    eventData: any,
    combatState: CombatState
  ): Promise<void> {
    await db.dungeonEvent.update({
      where: { id: eventId },
      data: {
        eventData: {
          ...eventData,
          combatState: combatState,
        },
      },
    });
  }

  /**
   * Check if combat is complete (victory or defeat)
   */
  static checkCombatCompletion(
    combatState: CombatState,
    lastResult: any
  ): { isComplete: boolean; victory: boolean; defeat: boolean } {
    // Check if minigame result indicates completion
    if (lastResult?.victory !== undefined || lastResult?.defeat !== undefined) {
      return {
        isComplete: true,
        victory: lastResult.victory || false,
        defeat: lastResult.defeat || false,
      };
    }

    // Check combat state
    const aliveMonsters = combatState.monsters?.filter(
      (m: any) => m.health > 0
    );
    const aliveParty = Object.values(combatState.partyHealthUpdates || {}).some(
      (health) => (health as number) > 0
    );

    if (aliveMonsters?.length === 0) {
      return { isComplete: true, victory: true, defeat: false };
    }

    if (!aliveParty) {
      return { isComplete: true, victory: false, defeat: true };
    }

    return { isComplete: false, victory: false, defeat: false };
  }

  /**
   * Process NPC actions in combat
   */
  static async processNPCActions(
    event: any,
    combatState: CombatState
  ): Promise<CombatResult[]> {
    const npcResults: CombatResult[] = [];

    // Get party members including NPCs
    const session = await db.dungeonSession.findUnique({
      where: { id: event.sessionId },
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

    if (!session?.party) {
      return npcResults;
    }

    // Find NPCs in the party
    const npcMembers = session.party.members.filter(
      (member) => member.isNPC && member.npcCompanion
    );

    for (const npcMember of npcMembers) {
      if (!npcMember.npcCompanion) continue;

      const npc = npcMember.npcCompanion;

      // Build combat context for NPC AI
      const combatContext = {
        npcId: npc.id,
        npcHealth: npc.maxHealth, // NPCs start at full health
        npcMaxHealth: npc.maxHealth,
        allies: session.party.members
          .filter((m) => !m.isNPC && m.character)
          .map((m) => ({
            id: m.character!.id,
            health: m.character!.currentHealth || m.character!.maxHealth,
            maxHealth: m.character!.maxHealth,
            isPlayer: true,
          })),
        enemies: combatState.monsters.map((monster) => ({
          id: monster.id.toString(),
          health: monster.health,
          maxHealth: monster.maxHealth || 100,
          threat: NPCAiService.calculateThreatLevel(monster),
        })),
        turnNumber: combatState.turnCount,
      };

      // Get NPC AI decision
      const npcAction = await NPCAiService.generateNPCAction(combatContext);

      console.log(
        `🤖 [CombatService] NPC ${npc.name} chose action: ${npcAction.action} - ${npcAction.reasoning}`
      );

      // Process NPC action
      let npcResult: CombatResult;

      switch (npcAction.action) {
        case "ATTACK":
          npcResult = await this.processNPCAttack(
            npc,
            npcAction,
            combatState,
            event
          );
          break;
        case "DEFEND":
          npcResult = await this.processNPCDefend(npc, npcAction, combatState);
          break;
        case "USE_ITEM":
          npcResult = await this.processNPCUseItem(
            npc,
            npcAction,
            combatState,
            event
          );
          break;
        default:
          npcResult = {
            success: true,
            message: `${npc.name} waits.`,
            damage: 0,
            isCritical: false,
            combatState: combatState,
          };
      }

      npcResults.push(npcResult);
    }

    return npcResults;
  }

  /**
   * Process NPC attack action
   */
  private static async processNPCAttack(
    npc: any,
    npcAction: any,
    combatState: CombatState,
    event: any
  ): Promise<CombatResult> {
    const targetEnemy = combatState.monsters.find(
      (enemy) => enemy.id.toString() === npcAction.targetId
    );

    if (!targetEnemy || targetEnemy.health <= 0) {
      return {
        success: false,
        message: `${npc.name} tried to attack but no valid target found.`,
        damage: 0,
        isCritical: false,
        combatState: combatState,
      };
    }

    // Calculate NPC damage
    const baseDamage = npc.attack || 10;
    const isCritical = Math.random() < (npc.criticalChance || 0.05);
    const finalDamage = isCritical ? baseDamage * 2 : baseDamage;

    // Apply damage to target
    targetEnemy.health -= finalDamage;
    combatState.playerDamageDealt += finalDamage;

    const message = isCritical
      ? `${npc.name} critically hits for ${finalDamage} damage!`
      : `${npc.name} attacks for ${finalDamage} damage!`;

    return {
      success: true,
      message: message,
      damage: finalDamage,
      isCritical: isCritical,
      combatState: combatState,
    };
  }

  /**
   * Process NPC defend action
   */
  private static async processNPCDefend(
    npc: any,
    npcAction: any,
    combatState: CombatState
  ): Promise<CombatResult> {
    return {
      success: true,
      message: `${npc.name} takes a defensive stance.`,
      damage: 0,
      isCritical: false,
      combatState: combatState,
    };
  }

  /**
   * Process NPC use item action
   */
  private static async processNPCUseItem(
    npc: any,
    npcAction: any,
    combatState: CombatState,
    event: any
  ): Promise<CombatResult> {
    // For now, NPCs don't have items, so this is a placeholder
    return {
      success: true,
      message: `${npc.name} attempts to use an item.`,
      damage: 0,
      isCritical: false,
      combatState: combatState,
    };
  }

  /**
   * Calculate damage based on character stats and enemy level
   */
  private static calculateDamage(character: any, enemyLevel: number): number {
    const baseAttack = character.attack || 10;
    const levelModifier = 1 + enemyLevel * 0.1;
    return Math.floor(baseAttack * levelModifier);
  }
}
