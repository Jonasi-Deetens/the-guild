import { db } from "@/lib/db";

export class GoldService {
  /**
   * Get the current gold amount for a character from their inventory
   */
  static async getGoldAmount(characterId: string): Promise<number> {
    try {
      // Find the Gold item
      const goldItem = await db.item.findFirst({
        where: {
          name: "Gold",
          type: "CURRENCY",
        },
      });

      if (!goldItem) {
        console.error("Gold item not found in database");
        return 0;
      }

      // Find the character's gold inventory entry
      const goldInventory = await db.inventory.findFirst({
        where: {
          characterId,
          itemId: goldItem.id,
          equipped: false, // Gold is not equipped
        },
      });

      return goldInventory?.quantity || 0;
    } catch (error) {
      console.error("Error getting gold amount:", error);
      return 0;
    }
  }

  /**
   * Add gold to a character's inventory
   */
  static async addGold(characterId: string, amount: number): Promise<void> {
    if (amount <= 0) return;

    try {
      // Find the Gold item
      const goldItem = await db.item.findFirst({
        where: {
          name: "Gold",
          type: "CURRENCY",
        },
      });

      if (!goldItem) {
        throw new Error("Gold item not found in database");
      }

      // Find existing gold inventory entry
      const existingGold = await db.inventory.findFirst({
        where: {
          characterId,
          itemId: goldItem.id,
          equipped: false,
        },
      });

      if (existingGold) {
        // Update existing entry
        await db.inventory.update({
          where: { id: existingGold.id },
          data: { quantity: existingGold.quantity + amount },
        });
      } else {
        // Create new entry
        await db.inventory.create({
          data: {
            characterId,
            itemId: goldItem.id,
            quantity: amount,
            equipped: false,
          },
        });
      }
    } catch (error) {
      console.error("Error adding gold:", error);
      throw error;
    }
  }

  /**
   * Remove gold from a character's inventory
   * Returns true if successful, false if insufficient gold
   */
  static async removeGold(
    characterId: string,
    amount: number
  ): Promise<boolean> {
    if (amount <= 0) return true;

    try {
      // Find the Gold item
      const goldItem = await db.item.findFirst({
        where: {
          name: "Gold",
          type: "CURRENCY",
        },
      });

      if (!goldItem) {
        console.error("Gold item not found in database");
        return false;
      }

      // Find existing gold inventory entry
      const existingGold = await db.inventory.findFirst({
        where: {
          characterId,
          itemId: goldItem.id,
          equipped: false,
        },
      });

      if (!existingGold || existingGold.quantity < amount) {
        return false; // Insufficient gold
      }

      if (existingGold.quantity === amount) {
        // Remove the entry completely
        await db.inventory.delete({
          where: { id: existingGold.id },
        });
      } else {
        // Update the quantity
        await db.inventory.update({
          where: { id: existingGold.id },
          data: { quantity: existingGold.quantity - amount },
        });
      }

      return true;
    } catch (error) {
      console.error("Error removing gold:", error);
      return false;
    }
  }

  /**
   * Check if a character has enough gold
   */
  static async hasEnoughGold(
    characterId: string,
    amount: number
  ): Promise<boolean> {
    if (amount <= 0) return true;

    try {
      const currentGold = await this.getGoldAmount(characterId);
      return currentGold >= amount;
    } catch (error) {
      console.error("Error checking gold amount:", error);
      return false;
    }
  }

  /**
   * Transfer gold between characters
   * Returns true if successful, false if insufficient gold
   */
  static async transferGold(
    fromCharacterId: string,
    toCharacterId: string,
    amount: number
  ): Promise<boolean> {
    if (amount <= 0) return true;

    try {
      // Check if sender has enough gold
      if (!(await this.hasEnoughGold(fromCharacterId, amount))) {
        return false;
      }

      // Remove from sender
      const removed = await this.removeGold(fromCharacterId, amount);
      if (!removed) {
        return false;
      }

      // Add to receiver
      await this.addGold(toCharacterId, amount);
      return true;
    } catch (error) {
      console.error("Error transferring gold:", error);
      return false;
    }
  }

  /**
   * Initialize gold for a new character (give starting gold)
   */
  static async initializeGold(
    characterId: string,
    startingAmount: number = 100
  ): Promise<void> {
    try {
      await this.addGold(characterId, startingAmount);
    } catch (error) {
      console.error("Error initializing gold:", error);
      throw error;
    }
  }
}
