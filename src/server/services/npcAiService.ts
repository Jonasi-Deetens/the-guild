import { db } from "@/lib/db";

export interface NPCAction {
  action: "ATTACK" | "DEFEND" | "USE_ITEM" | "WAIT";
  targetId?: string;
  itemId?: string;
  reasoning: string;
}

export interface CombatContext {
  npcId: string;
  npcHealth: number;
  npcMaxHealth: number;
  allies: Array<{
    id: string;
    health: number;
    maxHealth: number;
    isPlayer: boolean;
  }>;
  enemies: Array<{
    id: string;
    health: number;
    maxHealth: number;
    threat: number; // How dangerous this enemy is
  }>;
  turnNumber: number;
}

export class NPCAiService {
  /**
   * Generate an AI action for an NPC during combat
   */
  static async generateNPCAction(context: CombatContext): Promise<NPCAction> {
    const npc = await db.nPCCompanion.findUnique({
      where: { id: context.npcId },
    });

    if (!npc) {
      return { action: "WAIT", reasoning: "NPC not found" };
    }

    // Determine NPC role based on class
    const role = this.getNPCRole(npc.class);

    // Calculate health percentage
    const healthPercent = context.npcHealth / context.npcMaxHealth;

    // Find the most threatening enemy
    const primaryTarget = this.findPrimaryTarget(context.enemies);

    // Find allies that need healing
    const alliesNeedingHealing = context.allies.filter(
      (ally) => ally.health / ally.maxHealth < 0.5 && ally.id !== context.npcId
    );

    // Role-based decision making
    switch (role) {
      case "TANK":
        return this.getTankAction(context, npc, healthPercent, primaryTarget);

      case "HEALER":
        return this.getHealerAction(
          context,
          npc,
          healthPercent,
          alliesNeedingHealing,
          primaryTarget
        );

      case "DPS":
        return this.getDPSAction(context, npc, healthPercent, primaryTarget);

      case "SUPPORT":
        return this.getSupportAction(
          context,
          npc,
          healthPercent,
          primaryTarget
        );

      default:
        return this.getDefaultAction(context, npc, primaryTarget);
    }
  }

  /**
   * Determine NPC role based on class
   */
  private static getNPCRole(
    className: string
  ): "TANK" | "HEALER" | "DPS" | "SUPPORT" {
    const roleMap: Record<string, "TANK" | "HEALER" | "DPS" | "SUPPORT"> = {
      Warrior: "TANK",
      Paladin: "TANK",
      "Earth Guardian": "TANK",
      Cleric: "HEALER",
      Rogue: "DPS",
      Archer: "DPS",
      Mage: "DPS",
      "Storm Mage": "DPS",
      "Shadow Assassin": "DPS",
    };

    return roleMap[className] || "DPS";
  }

  /**
   * Find the most threatening enemy
   */
  private static findPrimaryTarget(
    enemies: CombatContext["enemies"]
  ): CombatContext["enemies"][0] | null {
    if (enemies.length === 0) return null;

    // Sort by threat level, then by health (prefer low health enemies)
    return enemies.sort((a, b) => {
      if (a.threat !== b.threat) {
        return b.threat - a.threat; // Higher threat first
      }
      return a.health - b.health; // Lower health first
    })[0];
  }

  /**
   * Tank behavior: Focus on protecting allies and drawing enemy attention
   */
  private static getTankAction(
    context: CombatContext,
    npc: any,
    healthPercent: number,
    primaryTarget: CombatContext["enemies"][0] | null
  ): NPCAction {
    // If health is very low, defend
    if (healthPercent < 0.3) {
      return {
        action: "DEFEND",
        reasoning: "Health is critically low, defending to survive",
      };
    }

    // If there's a primary target, attack it
    if (primaryTarget) {
      return {
        action: "ATTACK",
        targetId: primaryTarget.id,
        reasoning: `Attacking primary threat (${primaryTarget.threat} threat level)`,
      };
    }

    // Default to defending if no clear target
    return {
      action: "DEFEND",
      reasoning: "No clear target, defending to protect allies",
    };
  }

  /**
   * Healer behavior: Prioritize healing allies, attack when no healing needed
   */
  private static getHealerAction(
    context: CombatContext,
    npc: any,
    healthPercent: number,
    alliesNeedingHealing: CombatContext["allies"],
    primaryTarget: CombatContext["enemies"][0] | null
  ): NPCAction {
    // If self is critically low, defend
    if (healthPercent < 0.2) {
      return {
        action: "DEFEND",
        reasoning: "Self health critically low, defending",
      };
    }

    // If allies need healing, prioritize healing
    if (alliesNeedingHealing.length > 0) {
      const mostInjured = alliesNeedingHealing.sort(
        (a, b) => a.health / a.maxHealth - b.health / b.maxHealth
      )[0];

      // For now, we'll use a simple heal item (this would need to be implemented)
      // In a real implementation, you'd check for healing items or abilities
      return {
        action: "USE_ITEM",
        targetId: mostInjured.id,
        reasoning: `Healing most injured ally (${mostInjured.health}/${mostInjured.maxHealth} HP)`,
      };
    }

    // If no healing needed, attack the primary target
    if (primaryTarget) {
      return {
        action: "ATTACK",
        targetId: primaryTarget.id,
        reasoning: "No allies need healing, attacking primary target",
      };
    }

    return {
      action: "WAIT",
      reasoning: "No clear action needed",
    };
  }

  /**
   * DPS behavior: Focus on dealing damage to enemies
   */
  private static getDPSAction(
    context: CombatContext,
    npc: any,
    healthPercent: number,
    primaryTarget: CombatContext["enemies"][0] | null
  ): NPCAction {
    // If health is very low, defend
    if (healthPercent < 0.25) {
      return {
        action: "DEFEND",
        reasoning: "Health is low, defending to survive",
      };
    }

    // Always try to attack the primary target
    if (primaryTarget) {
      return {
        action: "ATTACK",
        targetId: primaryTarget.id,
        reasoning: `Attacking primary target (${primaryTarget.health}/${primaryTarget.maxHealth} HP)`,
      };
    }

    // If no target, wait
    return {
      action: "WAIT",
      reasoning: "No enemies to attack",
    };
  }

  /**
   * Support behavior: Buff allies and debuff enemies
   */
  private static getSupportAction(
    context: CombatContext,
    npc: any,
    healthPercent: number,
    primaryTarget: CombatContext["enemies"][0] | null
  ): NPCAction {
    // If health is low, defend
    if (healthPercent < 0.3) {
      return {
        action: "DEFEND",
        reasoning: "Health is low, defending",
      };
    }

    // Look for allies that could benefit from buffs
    const alliesNeedingBuffs = context.allies.filter(
      (ally) => ally.health / ally.maxHealth < 0.7 && ally.id !== context.npcId
    );

    if (alliesNeedingBuffs.length > 0) {
      const target = alliesNeedingBuffs[0];
      return {
        action: "USE_ITEM",
        targetId: target.id,
        reasoning: "Supporting ally with buff",
      };
    }

    // If no support needed, attack
    if (primaryTarget) {
      return {
        action: "ATTACK",
        targetId: primaryTarget.id,
        reasoning: "No support needed, attacking enemy",
      };
    }

    return {
      action: "WAIT",
      reasoning: "No clear action needed",
    };
  }

  /**
   * Default behavior for unknown classes
   */
  private static getDefaultAction(
    context: CombatContext,
    npc: any,
    primaryTarget: CombatContext["enemies"][0] | null
  ): NPCAction {
    if (primaryTarget) {
      return {
        action: "ATTACK",
        targetId: primaryTarget.id,
        reasoning: "Default behavior: attacking primary target",
      };
    }

    return {
      action: "WAIT",
      reasoning: "No enemies to attack",
    };
  }

  /**
   * Calculate threat level for an enemy
   */
  static calculateThreatLevel(enemy: any): number {
    // Simple threat calculation based on health and attack
    // In a real implementation, this would be more sophisticated
    const healthThreat = enemy.health / 100; // Normalize health
    const attackThreat = (enemy.attack || 10) / 20; // Normalize attack

    return healthThreat + attackThreat;
  }

  /**
   * Get AI decision for a specific NPC in a dungeon session
   */
  static async getNPCDecisionForSession(
    sessionId: string,
    npcId: string,
    turnNumber: number
  ): Promise<NPCAction> {
    try {
      // Get session context
      const session = await db.dungeonSession.findUnique({
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
          events: {
            where: { status: "ACTIVE" },
          },
        },
      });

      if (!session || !session.party) {
        return { action: "WAIT", reasoning: "No active session or party" };
      }

      // Find the NPC in the party
      const npcMember = session.party.members.find(
        (member) => member.npcCompanionId === npcId
      );

      if (!npcMember || !npcMember.npcCompanion) {
        return { action: "WAIT", reasoning: "NPC not found in party" };
      }

      // Build combat context
      const context: CombatContext = {
        npcId,
        npcHealth: npcMember.npcCompanion.maxHealth, // In real implementation, track current health
        npcMaxHealth: npcMember.npcCompanion.maxHealth,
        allies: session.party.members.map((member) => ({
          id: member.characterId,
          health: member.character?.currentHealth || 100,
          maxHealth: member.character?.maxHealth || 100,
          isPlayer: !member.isNPC,
        })),
        enemies: [], // TODO: Implement monster tracking in combat state
        turnNumber,
      };

      return await this.generateNPCAction(context);
    } catch (error) {
      console.error("Error getting NPC decision:", error);
      return { action: "WAIT", reasoning: "Error in AI decision making" };
    }
  }
}
