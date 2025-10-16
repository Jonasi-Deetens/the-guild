import { db } from "@/lib/db";
import { EquipmentSlot, ItemType } from "@prisma/client";

export interface EquipResult {
  success: boolean;
  message: string;
  equippedItem?: any;
  unequippedItem?: any;
}

export interface CharacterStats {
  attack: number;
  defense: number;
  speed: number;
  perception: number;
  health: number;
  attackBonus: number;
  defenseBonus: number;
  speedBonus: number;
  perceptionBonus: number;
  healthBonus: number;
}

export interface EquippedItems {
  weapon?: any;
  offHand?: any;
  head?: any;
  chest?: any;
  legs?: any;
  boots?: any;
  gloves?: any;
  ring1?: any;
  ring2?: any;
  amulet?: any;
}

export class EquipmentService {
  /**
   * Check if character meets item requirements
   */
  static async canEquip(
    character: any,
    item: any
  ): Promise<{ canEquip: boolean; reason?: string }> {
    // Check level requirement
    if (character.level < item.levelRequirement) {
      return {
        canEquip: false,
        reason: `Requires level ${item.levelRequirement} (you are level ${character.level})`,
      };
    }

    // Check stat requirements (using base stats, not equipped stats)
    if (character.attack < item.attackRequirement) {
      return {
        canEquip: false,
        reason: `Requires ${item.attackRequirement} attack (you have ${character.attack})`,
      };
    }

    if (character.defense < item.defenseRequirement) {
      return {
        canEquip: false,
        reason: `Requires ${item.defenseRequirement} defense (you have ${character.defense})`,
      };
    }

    if (character.speed < item.speedRequirement) {
      return {
        canEquip: false,
        reason: `Requires ${item.speedRequirement} speed (you have ${character.speed})`,
      };
    }

    if (character.perception < item.perceptionRequirement) {
      return {
        canEquip: false,
        reason: `Requires ${item.perceptionRequirement} perception (you have ${character.perception})`,
      };
    }

    return { canEquip: true };
  }

  /**
   * Get the equipment slot field name for a character
   */
  private static getSlotFieldName(slot: EquipmentSlot): string {
    switch (slot) {
      case EquipmentSlot.WEAPON:
        return "equippedWeapon";
      case EquipmentSlot.OFF_HAND:
        return "equippedOffHand";
      case EquipmentSlot.HEAD:
        return "equippedHead";
      case EquipmentSlot.CHEST:
        return "equippedChest";
      case EquipmentSlot.LEGS:
        return "equippedLegs";
      case EquipmentSlot.BOOTS:
        return "equippedBoots";
      case EquipmentSlot.GLOVES:
        return "equippedGloves";
      case EquipmentSlot.RING:
        return "equippedRing1"; // Default to ring1
      case EquipmentSlot.AMULET:
        return "equippedAmulet";
      default:
        throw new Error(`Unknown equipment slot: ${slot}`);
    }
  }

  /**
   * Get the equipment slot field name for ring (handles ring1/ring2 logic)
   */
  private static getRingSlotFieldName(character: any): string {
    if (!character.equippedRing1) return "equippedRing1";
    if (!character.equippedRing2) return "equippedRing2";
    return "equippedRing1"; // Default to ring1 if both are occupied
  }

  /**
   * Equip item to character
   */
  static async equipItem(
    characterId: string,
    itemId: string
  ): Promise<EquipResult> {
    try {
      // Get character and item data
      const character = await db.character.findUnique({
        where: { id: characterId },
        include: {
          inventory: {
            where: { itemId },
            include: { item: true },
          },
        },
      });

      if (!character) {
        return { success: false, message: "Character not found" };
      }

      const inventoryItem = character.inventory[0];
      if (!inventoryItem) {
        return { success: false, message: "Item not found in inventory" };
      }

      const item = inventoryItem.item;

      // Check if item can be equipped
      if (!item.equipmentSlot) {
        return { success: false, message: "This item cannot be equipped" };
      }

      // Check requirements
      const canEquipResult = await this.canEquip(character, item);
      if (!canEquipResult.canEquip) {
        return {
          success: false,
          message: canEquipResult.reason || "Cannot equip this item",
        };
      }

      // Determine slot field name
      let slotFieldName: string;
      if (item.equipmentSlot === EquipmentSlot.RING) {
        slotFieldName = this.getRingSlotFieldName(character);
      } else {
        slotFieldName = this.getSlotFieldName(item.equipmentSlot);
      }

      // Get currently equipped item in this slot
      const currentlyEquippedItemId = character[
        slotFieldName as keyof typeof character
      ] as string | null;
      let unequippedItem = null;

      // Start transaction
      await db.$transaction(async (tx) => {
        // Unequip current item if any
        if (currentlyEquippedItemId) {
          await tx.inventory.updateMany({
            where: {
              characterId,
              itemId: currentlyEquippedItemId,
              equipped: true,
            },
            data: { equipped: false },
          });

          // Get unequipped item details
          const unequippedItemData = await tx.item.findUnique({
            where: { id: currentlyEquippedItemId },
          });
          unequippedItem = unequippedItemData;
        }

        // Equip new item
        await tx.inventory.updateMany({
          where: {
            characterId,
            itemId,
            equipped: false,
          },
          data: { equipped: true },
        });

        // Update character equipment slot
        await tx.character.update({
          where: { id: characterId },
          data: {
            [slotFieldName]: itemId,
          },
        });
      });

      return {
        success: true,
        message: `Equipped ${item.name}`,
        equippedItem: item,
        unequippedItem,
      };
    } catch (error) {
      console.error("Error equipping item:", error);
      return { success: false, message: "Failed to equip item" };
    }
  }

  /**
   * Unequip item from slot
   */
  static async unequipItem(
    characterId: string,
    slot: EquipmentSlot
  ): Promise<void> {
    try {
      const slotFieldName = this.getSlotFieldName(slot);

      const character = await db.character.findUnique({
        where: { id: characterId },
        select: { [slotFieldName]: true } as any,
      });

      if (!character) {
        throw new Error("Character not found");
      }

      const equippedItemId = character[
        slotFieldName as keyof typeof character
      ] as string | null;

      if (!equippedItemId) {
        throw new Error("No item equipped in this slot");
      }

      await db.$transaction(async (tx) => {
        // Set inventory item as unequipped
        await tx.inventory.updateMany({
          where: {
            characterId,
            itemId: equippedItemId,
            equipped: true,
          },
          data: { equipped: false },
        });

        // Clear character equipment slot
        await tx.character.update({
          where: { id: characterId },
          data: {
            [slotFieldName]: null,
          },
        });
      });
    } catch (error) {
      console.error("Error unequipping item:", error);
      throw error;
    }
  }

  /**
   * Get all equipped items for a character
   */
  static async getEquippedItems(characterId: string): Promise<EquippedItems> {
    const character = await db.character.findUnique({
      where: { id: characterId },
      select: {
        equippedWeapon: true,
        equippedOffHand: true,
        equippedHead: true,
        equippedChest: true,
        equippedLegs: true,
        equippedBoots: true,
        equippedGloves: true,
        equippedRing1: true,
        equippedRing2: true,
        equippedAmulet: true,
      },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const equippedItemIds = [
      character.equippedWeapon,
      character.equippedOffHand,
      character.equippedHead,
      character.equippedChest,
      character.equippedLegs,
      character.equippedBoots,
      character.equippedGloves,
      character.equippedRing1,
      character.equippedRing2,
      character.equippedAmulet,
    ].filter(Boolean);

    const equippedItems = await db.item.findMany({
      where: { id: { in: equippedItemIds } },
    });

    const result: EquippedItems = {};

    if (character.equippedWeapon) {
      result.weapon = equippedItems.find(
        (item) => item.id === character.equippedWeapon
      );
    }
    if (character.equippedOffHand) {
      result.offHand = equippedItems.find(
        (item) => item.id === character.equippedOffHand
      );
    }
    if (character.equippedHead) {
      result.head = equippedItems.find(
        (item) => item.id === character.equippedHead
      );
    }
    if (character.equippedChest) {
      result.chest = equippedItems.find(
        (item) => item.id === character.equippedChest
      );
    }
    if (character.equippedLegs) {
      result.legs = equippedItems.find(
        (item) => item.id === character.equippedLegs
      );
    }
    if (character.equippedBoots) {
      result.boots = equippedItems.find(
        (item) => item.id === character.equippedBoots
      );
    }
    if (character.equippedGloves) {
      result.gloves = equippedItems.find(
        (item) => item.id === character.equippedGloves
      );
    }
    if (character.equippedRing1) {
      result.ring1 = equippedItems.find(
        (item) => item.id === character.equippedRing1
      );
    }
    if (character.equippedRing2) {
      result.ring2 = equippedItems.find(
        (item) => item.id === character.equippedRing2
      );
    }
    if (character.equippedAmulet) {
      result.amulet = equippedItems.find(
        (item) => item.id === character.equippedAmulet
      );
    }

    return result;
  }

  /**
   * Calculate total stats with equipment bonuses
   */
  static async calculateStats(characterId: string): Promise<CharacterStats> {
    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const equippedItems = await this.getEquippedItems(characterId);
    const allEquippedItems = Object.values(equippedItems).filter(Boolean);

    // Calculate flat bonuses
    let attackBonus = 0;
    let defenseBonus = 0;
    let speedBonus = 0;
    let perceptionBonus = 0;
    let healthBonus = 0;

    // Calculate percentage bonuses
    let attackPercent = 0;
    let defensePercent = 0;
    let speedPercent = 0;
    let perceptionPercent = 0;

    for (const item of allEquippedItems) {
      if (!item) continue;

      // Add flat bonuses
      attackBonus += item.attack || 0;
      defenseBonus += item.defense || 0;
      speedBonus += item.speed || 0;
      perceptionBonus += item.perception || 0;
      healthBonus += item.health || 0;

      // Add percentage bonuses
      attackPercent += item.attackPercent || 0;
      defensePercent += item.defensePercent || 0;
      speedPercent += item.speedPercent || 0;
      perceptionPercent += item.perceptionPercent || 0;
    }

    // Calculate final stats: base + flat bonuses, then apply percentage bonuses
    const finalAttack = Math.floor(
      (character.attack + attackBonus) * (1 + attackPercent)
    );
    const finalDefense = Math.floor(
      (character.defense + defenseBonus) * (1 + defensePercent)
    );
    const finalSpeed = Math.floor(
      (character.speed + speedBonus) * (1 + speedPercent)
    );
    const finalPerception = Math.floor(
      (character.perception + perceptionBonus) * (1 + perceptionPercent)
    );
    const finalHealth = character.maxHealth + healthBonus;

    return {
      attack: finalAttack,
      defense: finalDefense,
      speed: finalSpeed,
      perception: finalPerception,
      health: finalHealth,
      attackBonus,
      defenseBonus,
      speedBonus,
      perceptionBonus,
      healthBonus,
    };
  }

  /**
   * Swap item in slot (unequip old, equip new)
   */
  static async swapItem(
    characterId: string,
    itemId: string
  ): Promise<EquipResult> {
    // This is essentially the same as equipItem since it handles unequipping automatically
    return await this.equipItem(characterId, itemId);
  }
}
