import { db } from "@/lib/db";

export interface GeneratedLoot {
  itemId: string;
  itemName: string;
  quantity: number;
  rarity: string;
  value: number;
}

export class LootService {
  /**
   * Generate loot for a monster based on its template and rarity
   */
  static async generateLoot(
    monsterTemplateId: string,
    monsterRarity: string,
    sessionId: string
  ): Promise<GeneratedLoot[]> {
    console.log(
      `🎲 Generating loot for monster template ${monsterTemplateId} with rarity ${monsterRarity}`
    );

    // Get the monster's loot table
    const lootTable = await db.monsterLootTable.findMany({
      where: { monsterTemplateId },
      include: { item: true },
    });

    if (lootTable.length === 0) {
      console.log(
        `⚠️ No loot table found for monster template ${monsterTemplateId}`
      );
      return [];
    }

    // Apply rarity modifier
    const rarityModifiers: Record<string, number> = {
      COMMON: 1.0,
      ELITE: 1.3,
      RARE: 1.5,
      BOSS: 2.0,
    };

    const rarityModifier = rarityModifiers[monsterRarity] || 1.0;
    console.log(
      `🎯 Applying rarity modifier: ${rarityModifier}x for ${monsterRarity}`
    );

    const generatedLoot: GeneratedLoot[] = [];

    // Roll for each item in the loot table
    for (const lootEntry of lootTable) {
      // Apply rarity modifier to drop chance
      const modifiedDropChance = Math.min(
        1.0,
        lootEntry.dropChance * rarityModifier
      );

      // Roll for drop (0.0 to 1.0)
      const roll = Math.random();

      console.log(
        `🎲 Rolling for ${lootEntry.item.name}: ${roll.toFixed(
          3
        )} vs ${modifiedDropChance.toFixed(
          3
        )} (base: ${lootEntry.dropChance.toFixed(3)})`
      );

      if (roll < modifiedDropChance) {
        // Item dropped! Determine quantity
        const quantity =
          Math.floor(
            Math.random() * (lootEntry.maxQuantity - lootEntry.minQuantity + 1)
          ) + lootEntry.minQuantity;

        console.log(`✅ ${lootEntry.item.name} dropped! Quantity: ${quantity}`);

        // Create DungeonLoot entry
        await db.dungeonLoot.create({
          data: {
            itemId: lootEntry.item.id,
            quantity,
            sessionId,
          },
        });

        generatedLoot.push({
          itemId: lootEntry.item.id,
          itemName: lootEntry.item.name,
          quantity,
          rarity: lootEntry.item.rarity,
          value: lootEntry.item.value,
        });
      }
    }

    console.log(
      `🎁 Generated ${generatedLoot.length} loot items for session ${sessionId}`
    );
    return generatedLoot;
  }

  /**
   * Claim all unclaimed loot for a session and add to character inventory
   */
  static async claimLoot(
    sessionId: string,
    characterId: string
  ): Promise<GeneratedLoot[]> {
    console.log(
      `🎁 Claiming loot for character ${characterId} in session ${sessionId}`
    );

    // Get all unclaimed loot for the session
    const unclaimedLoot = await db.dungeonLoot.findMany({
      where: {
        sessionId,
        claimedBy: null,
      },
      include: { item: true },
    });

    if (unclaimedLoot.length === 0) {
      console.log(`⚠️ No unclaimed loot found for session ${sessionId}`);
      return [];
    }

    const claimedLoot: GeneratedLoot[] = [];

    for (const loot of unclaimedLoot) {
      // Check if character already has this item in inventory
      const existingInventory = await db.inventory.findUnique({
        where: {
          characterId_itemId: {
            characterId,
            itemId: loot.itemId,
          },
        },
      });

      if (existingInventory) {
        // Update existing inventory entry
        await db.inventory.update({
          where: {
            characterId_itemId: {
              characterId,
              itemId: loot.itemId,
            },
          },
          data: {
            quantity: existingInventory.quantity + loot.quantity,
          },
        });
      } else {
        // Create new inventory entry
        await db.inventory.create({
          data: {
            characterId,
            itemId: loot.itemId,
            quantity: loot.quantity,
            equipped: false,
          },
        });
      }

      // Mark loot as claimed
      await db.dungeonLoot.update({
        where: { id: loot.id },
        data: {
          claimedBy: characterId,
          claimedAt: new Date(),
        },
      });

      claimedLoot.push({
        itemId: loot.itemId,
        itemName: loot.item.name,
        quantity: loot.quantity,
        rarity: loot.item.rarity,
        value: loot.item.value,
      });

      console.log(
        `✅ Claimed ${loot.quantity}x ${loot.item.name} for character ${characterId}`
      );
    }

    console.log(`🎁 Successfully claimed ${claimedLoot.length} loot items`);
    return claimedLoot;
  }

  /**
   * Get all loot for a session (claimed and unclaimed)
   */
  static async getSessionLoot(sessionId: string): Promise<GeneratedLoot[]> {
    const sessionLoot = await db.dungeonLoot.findMany({
      where: { sessionId },
      include: { item: true },
    });

    return sessionLoot.map((loot) => ({
      itemId: loot.itemId,
      itemName: loot.item.name,
      quantity: loot.quantity,
      rarity: loot.item.rarity,
      value: loot.item.value,
      claimedBy: loot.claimedBy,
      claimedAt: loot.claimedAt,
    }));
  }

  /**
   * Generate mission completion loot
   */
  static async generateMissionLoot(sessionId: string): Promise<void> {
    console.log(
      `🎁 Generating mission completion loot for session ${sessionId}`
    );

    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true },
    });

    if (!session) {
      console.log(`⚠️ Session ${sessionId} not found`);
      return;
    }

    // Generate base mission completion loot (gold coins)
    const baseGoldReward = session.mission.baseReward || 100;
    const goldItem = await db.item.findFirst({
      where: { name: "Gold Coin" },
    });

    if (goldItem) {
      await db.dungeonLoot.create({
        data: {
          sessionId,
          itemId: goldItem.id,
          quantity: baseGoldReward,
          rarity: "COMMON",
          value: baseGoldReward,
        },
      });
      console.log(
        `💰 Generated ${baseGoldReward} gold coins for mission completion`
      );
    }

    // TODO: Add other mission completion loot (items, etc.) based on mission difficulty
    console.log(
      `✅ Mission completion loot generated for session ${sessionId}`
    );
  }
}
