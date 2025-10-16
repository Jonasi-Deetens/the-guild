import { db } from "@/lib/db";
import { Character } from "@prisma/client";

export class RestPhaseService {
  /**
   * Calculate healing for party members during rest
   */
  static calculateRestHealing(character: Character): number {
    // Base healing is 25% of max health
    const baseHealing = Math.floor(character.maxHealth * 0.25);

    // Add bonus based on character level (1% per level)
    const levelBonus = Math.floor(
      character.maxHealth * (character.level * 0.01)
    );

    const totalHealing = baseHealing + levelBonus;

    // Don't heal more than the character's missing health
    const missingHealth = character.maxHealth - character.currentHealth;
    return Math.min(totalHealing, missingHealth);
  }

  /**
   * Apply rest effects (healing, buff duration, etc.)
   */
  static async applyRestEffects(sessionId: string): Promise<void> {
    console.log(
      `💤 [RestPhaseService] Applying rest effects for session: ${sessionId}`
    );

    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        character: true, // Include character for solo sessions
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
      console.log(`💤 [RestPhaseService] Session not found: ${sessionId}`);
      return;
    }

    // Handle solo sessions
    if (!session.party && session.character) {
      const healing = this.calculateRestHealing(session.character);
      if (healing > 0) {
        const newHealth = Math.min(
          session.character.maxHealth,
          session.character.currentHealth + healing
        );

        await db.character.update({
          where: { id: session.character.id },
          data: { currentHealth: newHealth },
        });

        console.log(
          `💤 [RestPhaseService] Healed solo character ${session.character.name} for ${healing} HP (${session.character.currentHealth} -> ${newHealth})`
        );
      }
      return;
    }

    // Handle party sessions
    if (!session.party) {
      console.log(
        `💤 [RestPhaseService] No party found for session ${sessionId}`
      );
      return;
    }

    // Heal all party members (both players and NPCs)
    for (const member of session.party.members) {
      // Heal player characters
      if (member.character && !member.isNPC) {
        const healing = this.calculateRestHealing(member.character);
        if (healing > 0) {
          const newHealth = Math.min(
            member.character.maxHealth,
            member.character.currentHealth + healing
          );

          await db.character.update({
            where: { id: member.character.id },
            data: { currentHealth: newHealth },
          });

          console.log(
            `💤 [RestPhaseService] Healed ${member.character.name} for ${healing} HP (${member.character.currentHealth} -> ${newHealth})`
          );
        }
      }

      // Heal NPC companions
      if (member.npcCompanion && member.isNPC) {
        const healing = this.calculateRestHealing(member.npcCompanion);
        if (healing > 0) {
          const newHealth = Math.min(
            member.npcCompanion.maxHealth,
            member.npcCompanion.currentHealth + healing
          );

          await db.nPCCompanion.update({
            where: { id: member.npcCompanion.id },
            data: { currentHealth: newHealth },
          });

          console.log(
            `💤 [RestPhaseService] Healed NPC ${member.npcCompanion.name} for ${healing} HP (${member.npcCompanion.currentHealth} -> ${newHealth})`
          );
        }
      }
    }

    console.log(
      `💤 [RestPhaseService] Rest effects applied for session ${sessionId}`
    );
  }

  /**
   * Use consumable items during rest
   */
  static async useItemDuringRest(
    sessionId: string,
    characterId: string,
    itemId: string
  ): Promise<{ success: boolean; message: string }> {
    console.log(
      `🧪 [RestPhaseService] Using item ${itemId} for character ${characterId} during rest`
    );

    try {
      // Get character and item
      const character = await db.character.findUnique({
        where: { id: characterId },
        include: {
          inventory: {
            include: { item: true },
          },
        },
      });

      if (!character) {
        return { success: false, message: "Character not found" };
      }

      const inventoryItem = character.inventory.find(
        (inv) => inv.itemId === itemId && inv.quantity > 0
      );

      if (!inventoryItem) {
        return { success: false, message: "Item not found in inventory" };
      }

      const item = inventoryItem.item;

      // Check if item is consumable
      if (item.type !== "CONSUMABLE") {
        return { success: false, message: "Item is not consumable" };
      }

      // Apply item effects based on item properties
      let effectApplied = false;
      let effectMessage = "";

      // Health potion effect
      if (
        item.name.toLowerCase().includes("potion") ||
        item.name.toLowerCase().includes("heal")
      ) {
        const healing = item.value || 50; // Default healing amount
        const newHealth = Math.min(
          character.maxHealth,
          character.currentHealth + healing
        );

        await db.character.update({
          where: { id: characterId },
          data: { currentHealth: newHealth },
        });

        effectApplied = true;
        effectMessage = `Healed for ${healing} HP`;
      }

      // Other consumable effects can be added here
      // e.g., mana potions, buff potions, etc.

      if (!effectApplied) {
        return { success: false, message: "Item effect not implemented" };
      }

      // Remove item from inventory
      if (inventoryItem.quantity === 1) {
        await db.inventory.delete({
          where: { id: inventoryItem.id },
        });
      } else {
        await db.inventory.update({
          where: { id: inventoryItem.id },
          data: { quantity: inventoryItem.quantity - 1 },
        });
      }

      console.log(
        `🧪 [RestPhaseService] Used ${item.name} for ${character.name}: ${effectMessage}`
      );
      return { success: true, message: effectMessage };
    } catch (error) {
      console.error(`🧪 [RestPhaseService] Error using item:`, error);
      return { success: false, message: "Failed to use item" };
    }
  }

  /**
   * Manage equipment changes during rest
   */
  static async changeEquipment(
    characterId: string,
    itemId: string,
    slot: string
  ): Promise<{ success: boolean; message: string }> {
    console.log(
      `⚔️ [RestPhaseService] Changing equipment for character ${characterId}: ${itemId} to ${slot}`
    );

    try {
      // Get character and item
      const character = await db.character.findUnique({
        where: { id: characterId },
        include: {
          inventory: {
            include: { item: true },
          },
        },
      });

      if (!character) {
        return { success: false, message: "Character not found" };
      }

      const inventoryItem = character.inventory.find(
        (inv) => inv.itemId === itemId && inv.quantity > 0
      );

      if (!inventoryItem) {
        return { success: false, message: "Item not found in inventory" };
      }

      const item = inventoryItem.item;

      // Check if item is equipment
      if (!["WEAPON", "ARMOR", "ACCESSORY"].includes(item.type)) {
        return { success: false, message: "Item is not equipment" };
      }

      // For now, just return success - equipment system can be implemented later
      // This would involve:
      // 1. Unequipping current item in slot
      // 2. Equipping new item
      // 3. Updating character stats
      // 4. Moving items between inventory and equipment slots

      console.log(
        `⚔️ [RestPhaseService] Equipment change requested: ${item.name} to ${slot}`
      );
      return { success: true, message: "Equipment change not yet implemented" };
    } catch (error) {
      console.error(`⚔️ [RestPhaseService] Error changing equipment:`, error);
      return { success: false, message: "Failed to change equipment" };
    }
  }

  /**
   * Get party health status for rest phase UI
   */
  static async getPartyHealthStatus(sessionId: string): Promise<any[]> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        character: true, // Include character for solo sessions
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
      return [];
    }

    // Handle solo sessions
    if (!session.party && session.character) {
      return [
        {
          id: session.character.id,
          name: session.character.name,
          currentHealth: session.character.currentHealth,
          maxHealth: session.character.maxHealth,
          isNPC: false,
          healing: this.calculateRestHealing(session.character),
        },
      ];
    }

    // Handle party sessions
    if (!session.party) {
      return [];
    }

    return session.party.members
      .map((member) => {
        if (member.character && !member.isNPC) {
          return {
            id: member.character.id,
            name: member.character.name,
            currentHealth: member.character.currentHealth,
            maxHealth: member.character.maxHealth,
            isNPC: false,
            healing: this.calculateRestHealing(member.character),
          };
        } else if (member.npcCompanion && member.isNPC) {
          return {
            id: member.npcCompanion.id,
            name: member.npcCompanion.name,
            currentHealth:
              member.npcCompanion.currentHealth ||
              member.npcCompanion.maxHealth,
            maxHealth: member.npcCompanion.maxHealth,
            isNPC: true,
            healing: this.calculateRestHealing(member.npcCompanion), // NPCs now heal during rest
          };
        }
        return null;
      })
      .filter(Boolean);
  }
}
