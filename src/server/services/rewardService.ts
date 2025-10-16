import { db } from "@/lib/db";

export interface RewardData {
  gold?: number;
  experience?: number;
  items?: Array<{
    itemId: string;
    quantity: number;
  }>;
  healthChange?: number; // Positive for healing, negative for damage
  statChanges?: Record<string, number>;
}

export interface EventResult {
  eventId: string;
  characterId: string;
  rewards: RewardData;
  timestamp: Date;
}

export class RewardService {
  /**
   * Apply immediate rewards from an event completion
   */
  static async applyEventRewards(
    sessionId: string,
    eventId: string,
    characterId: string,
    rewards: RewardData
  ): Promise<void> {
    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    // Start transaction to ensure all rewards are applied atomically
    await db.$transaction(async (tx) => {
      const updates: any = {};

      // Apply gold reward
      if (rewards.gold && rewards.gold > 0) {
        updates.gold = character.gold + rewards.gold;
      }

      // Apply experience reward
      if (rewards.experience && rewards.experience > 0) {
        updates.experience = character.experience + rewards.experience;
      }

      // Apply health changes
      if (rewards.healthChange) {
        const newHealth = Math.max(
          0,
          Math.min(
            character.maxHealth,
            character.currentHealth + rewards.healthChange
          )
        );
        updates.currentHealth = newHealth;
      }

      // Apply stat changes
      if (rewards.statChanges) {
        Object.entries(rewards.statChanges).forEach(([stat, change]) => {
          if (stat in character) {
            updates[stat] = (character as any)[stat] + change;
          }
        });
      }

      // Update character
      if (Object.keys(updates).length > 0) {
        await tx.character.update({
          where: { id: characterId },
          data: updates,
        });
      }

      // Add items to inventory
      if (rewards.items && rewards.items.length > 0) {
        for (const item of rewards.items) {
          // Check if character already has this item
          const existingItem = await tx.inventory.findFirst({
            where: {
              characterId: characterId,
              itemId: item.itemId,
            },
          });

          if (existingItem) {
            // Update quantity
            await tx.inventory.update({
              where: { id: existingItem.id },
              data: {
                quantity: existingItem.quantity + item.quantity,
              },
            });
          } else {
            // Create new inventory entry
            await tx.inventory.create({
              data: {
                characterId: characterId,
                itemId: item.itemId,
                quantity: item.quantity,
              },
            });
          }
        }
      }

      // Log the reward transaction
      await tx.dungeonStatistics.upsert({
        where: { sessionId: sessionId },
        update: {
          goldEarned: { increment: rewards.gold || 0 },
          experienceGained: { increment: rewards.experience || 0 },
          itemsFound: { increment: rewards.items?.length || 0 },
        },
        create: {
          sessionId: sessionId,
          goldEarned: rewards.gold || 0,
          experienceGained: rewards.experience || 0,
          itemsFound: rewards.items?.length || 0,
        },
      });
    });
  }

  /**
   * Rollback rewards from incomplete events on mission failure
   */
  static async rollbackIncompleteRewards(sessionId: string): Promise<void> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        events: {
          where: { status: "COMPLETED" },
          include: { playerActions: true },
        },
      },
    });

    if (!session) {
      return;
    }

    // Get all completed events and their rewards
    const completedEvents = session.events;

    // For now, we'll keep all rewards from completed events
    // In a more complex system, we might want to rollback some rewards
    // based on mission failure conditions

    console.log(
      `🔄 Mission ${sessionId} failed, keeping rewards from ${completedEvents.length} completed events`
    );
  }

  /**
   * Apply mission completion bonus rewards
   */
  static async applyMissionCompletionRewards(sessionId: string): Promise<void> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        mission: true,
        character: true, // Include character for solo sessions
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
      return;
    }

    // Handle party missions
    if (session.party) {
      const partyMembers = session.party.members;

      // Apply base mission rewards to all party members
      for (const member of partyMembers) {
        // Only give rewards to player characters (not NPCs)
        if (
          member.character &&
          member.character.currentHealth != null &&
          member.character.currentHealth > 0
        ) {
          // Only alive members get rewards
          await this.applyEventRewards(
            sessionId,
            "mission_completion",
            member.character.id,
            {
              gold: session.mission.baseReward,
              experience: session.mission.experienceReward,
            }
          );
        }
      }
    } else {
      // Handle solo missions - use the character from the session
      if (session.character && session.character.currentHealth > 0) {
        console.log(
          `🎯 [RewardService] Found character for solo session: ${session.character.name}`
        );
        await this.applyEventRewards(
          sessionId,
          "mission_completion",
          session.character.id,
          {
            gold: session.mission.baseReward,
            experience: session.mission.experienceReward,
          }
        );
      } else {
        console.log(
          `⚠️ [RewardService] Character not found or dead for solo session ${sessionId}`
        );
      }
    }

    console.log(
      `🎉 Applied mission completion rewards for session ${sessionId}`
    );
  }

  /**
   * Check if character should level up and apply stat points
   */
  static async checkAndApplyLevelUp(characterId: string): Promise<boolean> {
    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      return false;
    }

    // Calculate required experience for next level
    const requiredExp = this.calculateRequiredExperience(character.level + 1);

    if (character.experience >= requiredExp) {
      // Level up
      await db.character.update({
        where: { id: characterId },
        data: {
          level: character.level + 1,
          pendingStatPoints: character.pendingStatPoints + 1,
          maxHealth: character.maxHealth + 10, // Increase max health
          currentHealth: character.maxHealth + 10, // Full heal on level up
        },
      });

      console.log(
        `🎊 Character ${characterId} leveled up to ${character.level + 1}!`
      );
      return true;
    }

    return false;
  }

  /**
   * Calculate required experience for a given level
   */
  private static calculateRequiredExperience(level: number): number {
    // Simple exponential formula: level^2 * 100
    return level * level * 100;
  }

  /**
   * Get reward summary for a character in a session
   */
  static async getRewardSummary(
    sessionId: string,
    characterId: string
  ): Promise<{
    totalGold: number;
    totalExperience: number;
    itemsFound: number;
    healthChange: number;
  }> {
    const stats = await db.dungeonStatistics.findUnique({
      where: { sessionId: sessionId },
    });

    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    return {
      totalGold: stats?.goldEarned || 0,
      totalExperience: stats?.experienceGained || 0,
      itemsFound: stats?.itemsFound || 0,
      healthChange: character ? character.currentHealth - 100 : 0, // Assuming 100 is base health
    };
  }
}
