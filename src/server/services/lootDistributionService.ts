import { db } from "@/lib/db";
import { GoldService } from "./goldService";

export interface LootDistributionResult {
  success: boolean;
  message: string;
  assignedLoot?: any[];
  error?: string;
}

export interface LootRollResult {
  characterId: string;
  characterName: string;
  rollType: "NEED" | "GREED";
  rollValue: number;
  timestamp: Date;
}

export class LootDistributionService {
  /**
   * Distribute loot based on party settings
   */
  static async distributeLoot(
    sessionId: string
  ): Promise<LootDistributionResult> {
    console.log(`🎲 Starting loot distribution for session ${sessionId}`);

    // Get session with party information
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
      },
    });

    if (!session) {
      return {
        success: false,
        message: "Session not found",
        error: "Session not found",
      };
    }

    // Get all unclaimed loot for the session
    const unclaimedLoot = await db.dungeonLoot.findMany({
      where: {
        sessionId,
        claimedBy: null,
      },
      include: {
        item: true,
      },
    });

    if (unclaimedLoot.length === 0) {
      return {
        success: true,
        message: "No unclaimed loot found",
        assignedLoot: [],
      };
    }

    console.log(`🎁 Found ${unclaimedLoot.length} unclaimed loot items`);

    // Handle different distribution types
    if (session.party) {
      // Party mission - use party's loot distribution setting
      switch (session.party.lootDistributionType) {
        case "NEED_GREED":
          return await this.distributeWithNeedGreed(session, unclaimedLoot);
        case "MASTER_LOOTER":
          return await this.distributeWithMasterLooter(session, unclaimedLoot);
        case "AUTO":
        default:
          return await this.distributeAutomatically(session, unclaimedLoot);
      }
    } else {
      // Solo mission - auto distribute to the character
      return await this.distributeAutomatically(session, unclaimedLoot);
    }
  }

  /**
   * Distribute loot using Need/Greed system
   */
  private static async distributeWithNeedGreed(
    session: any,
    unclaimedLoot: any[]
  ): Promise<LootDistributionResult> {
    console.log(`🎲 Using Need/Greed distribution system`);

    // Get only player characters (exclude NPCs from rolling)
    const playerMembers = session.party.members
      .filter((m: any) => !m.isNPC && m.character)
      .map((m: any) => m.character);

    const assignedLoot: any[] = [];

    for (const loot of unclaimedLoot) {
      // Gold coins are always split with NPCs taking their share
      if (loot.item.name === "Gold Coin") {
        await this.splitGoldWithNPCs(session, loot, playerMembers);
        assignedLoot.push({
          ...loot,
          distributionType: "GOLD_SPLIT",
          assignedTo: "ALL",
        });
        continue;
      }

      // For other items, set up for Need/Greed rolling (NPCs don't participate)
      await db.dungeonLoot.update({
        where: { id: loot.id },
        data: {
          distributionType: "NEED_GREED",
        },
      });

      assignedLoot.push({
        ...loot,
        distributionType: "NEED_GREED",
        assignedTo: null,
        needsRolling: true,
      });
    }

    return {
      success: true,
      message: `Loot distribution set up for Need/Greed rolling. ${
        assignedLoot.filter((l) => l.distributionType === "GOLD_SPLIT").length
      } gold items split with NPCs taking their share.`,
      assignedLoot,
    };
  }

  /**
   * Distribute loot using Master Looter system
   */
  private static async distributeWithMasterLooter(
    session: any,
    unclaimedLoot: any[]
  ): Promise<LootDistributionResult> {
    console.log(`👑 Using Master Looter distribution system`);

    // Get only player characters (exclude NPCs from distribution)
    const playerMembers = session.party.members
      .filter((m: any) => !m.isNPC && m.character)
      .map((m: any) => m.character);

    const assignedLoot: any[] = [];

    for (const loot of unclaimedLoot) {
      // Gold coins are always split with NPCs taking their share
      if (loot.item.name === "Gold Coin") {
        await this.splitGoldWithNPCs(session, loot, playerMembers);
        assignedLoot.push({
          ...loot,
          distributionType: "GOLD_SPLIT",
          assignedTo: "ALL",
        });
        continue;
      }

      // For other items, assign to master looter for distribution
      await db.dungeonLoot.update({
        where: { id: loot.id },
        data: {
          distributionType: "MASTER_LOOTER",
          assignedTo: session.party.masterLooterId || session.party.leaderId,
        },
      });

      assignedLoot.push({
        ...loot,
        distributionType: "MASTER_LOOTER",
        assignedTo: session.party.masterLooterId || session.party.leaderId,
        needsAssignment: true,
      });
    }

    return {
      success: true,
      message: `Loot assigned to Master Looter for distribution. ${
        assignedLoot.filter((l) => l.distributionType === "GOLD_SPLIT").length
      } gold items split with NPCs taking their share.`,
      assignedLoot,
    };
  }

  /**
   * Distribute loot automatically (current system)
   */
  private static async distributeAutomatically(
    session: any,
    unclaimedLoot: any[]
  ): Promise<LootDistributionResult> {
    console.log(`🤖 Using automatic distribution system`);

    // Get only player characters (exclude NPCs from item distribution)
    const playerMembers =
      session.party?.members
        .filter((m: any) => !m.isNPC && m.character)
        .map((m: any) => m.character) || [];

    const assignedLoot: any[] = [];

    for (const loot of unclaimedLoot) {
      // Gold coins are always split with NPCs taking their share
      if (loot.item.name === "Gold Coin" && playerMembers.length > 0) {
        await this.splitGoldWithNPCs(session, loot, playerMembers);
        assignedLoot.push({
          ...loot,
          distributionType: "GOLD_SPLIT",
          assignedTo: "ALL",
        });
        continue;
      }

      // For other items, assign to all player characters only (NPCs don't get items)
      if (playerMembers.length > 0) {
        for (const member of playerMembers) {
          await this.assignLootToCharacter(loot, member.id);
        }
        assignedLoot.push({
          ...loot,
          distributionType: "AUTO",
          assignedTo: "ALL",
        });
      } else {
        // Solo mission - assign to the character
        const character = await this.getSoloCharacter(session);
        if (character) {
          await this.assignLootToCharacter(loot, character.id);
          assignedLoot.push({
            ...loot,
            distributionType: "AUTO",
            assignedTo: character.id,
          });
        }
      }
    }

    return {
      success: true,
      message: `Loot distributed automatically. ${
        assignedLoot.filter((l) => l.distributionType === "GOLD_SPLIT").length
      } gold items split with NPCs taking their share.`,
      assignedLoot,
    };
  }

  /**
   * Split gold with NPCs taking their share (20% per NPC)
   */
  private static async splitGoldWithNPCs(
    session: any,
    goldLoot: any,
    playerMembers: any[]
  ): Promise<void> {
    const totalGold = goldLoot.quantity;

    // Count NPCs in the party
    const npcCount = session.party.members.filter((m: any) => m.isNPC).length;

    // Calculate NPC share (20% per NPC)
    const npcSharePercent = npcCount * 0.2;
    const npcTotalShare = Math.floor(totalGold * npcSharePercent);
    const playerGold = totalGold - npcTotalShare;

    // Split remaining gold among players
    const goldPerPlayer =
      playerMembers.length > 0
        ? Math.floor(playerGold / playerMembers.length)
        : 0;
    const playerRemainder =
      playerMembers.length > 0 ? playerGold % playerMembers.length : 0;

    console.log(
      `💰 Splitting ${totalGold} gold: ${npcTotalShare} to ${npcCount} NPCs (${
        npcSharePercent * 100
      }%), ${playerGold} to ${
        playerMembers.length
      } players (${goldPerPlayer} each)`
    );

    // Give gold to players
    for (let i = 0; i < playerMembers.length; i++) {
      const member = playerMembers[i];
      const goldForMember = goldPerPlayer + (i < playerRemainder ? 1 : 0);

      if (goldForMember > 0) {
        // Add gold using GoldService
        await GoldService.addGold(member.id, goldForMember);

        console.log(`💰 Gave ${goldForMember} gold to player ${member.name}`);
      }
    }

    // Mark loot as claimed (NPCs don't actually get the gold, it's just deducted)
    if (playerMembers.length > 0) {
      await db.dungeonLoot.update({
        where: { id: goldLoot.id },
        data: {
          claimedBy: playerMembers[0].id, // Mark as claimed by first player
          claimedAt: new Date(),
          distributionType: "GOLD_SPLIT",
        },
      });
    }

    if (npcTotalShare > 0) {
      console.log(
        `💰 NPCs took their share: ${npcTotalShare} gold (${npcCount} NPCs)`
      );
    }
  }

  /**
   * Split gold with NPCs taking their share but not receiving it
   */
  private static async splitGoldWithNPCs(
    session: any,
    goldLoot: any,
    playerMembers: any[]
  ): Promise<void> {
    const totalGold = goldLoot.quantity;
    const totalMembers = session.party.members.length;
    const npcCount = session.party.members.filter((m: any) => m.isNPC).length;

    // NPCs take their share but don't receive gold directly
    const npcShare = npcCount * Math.floor(totalGold / totalMembers);
    const playerGold = totalGold - npcShare;

    const goldPerPlayer =
      playerMembers.length > 0
        ? Math.floor(playerGold / playerMembers.length)
        : 0;
    const remainder =
      playerMembers.length > 0 ? playerGold % playerMembers.length : 0;

    console.log(
      `💰 Need/Greed: Splitting ${totalGold} gold: ${npcShare} to ${npcCount} NPCs, ${playerGold} to ${playerMembers.length} players (${goldPerPlayer} each, ${remainder} remainder)`
    );

    // Give gold to players
    for (let i = 0; i < playerMembers.length; i++) {
      const member = playerMembers[i];
      const goldForMember = goldPerPlayer + (i < remainder ? 1 : 0);

      if (goldForMember > 0) {
        // Add gold using GoldService
        await GoldService.addGold(member.id, goldForMember);

        console.log(`💰 Gave ${goldForMember} gold to player ${member.name}`);
      }
    }

    // Mark loot as claimed
    if (playerMembers.length > 0) {
      await db.dungeonLoot.update({
        where: { id: goldLoot.id },
        data: {
          claimedBy: playerMembers[0].id,
          claimedAt: new Date(),
          distributionType: "GOLD_SPLIT",
        },
      });
    }

    // Log NPC share
    if (npcShare > 0) {
      console.log(
        `💰 ${npcShare} gold allocated to ${npcCount} NPCs (not distributed)`
      );
    }
  }

  /**
   * Split gold equally among all party members
   */
  private static async splitGoldEqually(
    session: any,
    goldLoot: any,
    partyMembers: any[]
  ): Promise<void> {
    const totalGold = goldLoot.quantity;

    // Separate players and NPCs
    const playerMembers = partyMembers.filter((member) => !member.isNPC);
    const npcMembers = partyMembers.filter((member) => member.isNPC);

    // NPCs take their share but don't receive gold directly
    const npcShare =
      npcMembers.length * Math.floor(totalGold / partyMembers.length);
    const playerGold = totalGold - npcShare;

    const goldPerPlayer =
      playerMembers.length > 0
        ? Math.floor(playerGold / playerMembers.length)
        : 0;
    const remainder =
      playerMembers.length > 0 ? playerGold % playerMembers.length : 0;

    console.log(
      `💰 Splitting ${totalGold} gold: ${npcShare} to ${npcMembers.length} NPCs, ${playerGold} to ${playerMembers.length} players (${goldPerPlayer} each, ${remainder} remainder)`
    );

    // Give gold to players
    for (let i = 0; i < playerMembers.length; i++) {
      const member = playerMembers[i];
      const goldForMember = goldPerPlayer + (i < remainder ? 1 : 0);

      if (goldForMember > 0) {
        // Add gold using GoldService
        await GoldService.addGold(member.characterId, goldForMember);

        console.log(
          `💰 Gave ${goldForMember} gold to player ${member.character?.name}`
        );
      }
    }

    // Mark loot as claimed (NPCs don't get individual claims)
    if (playerMembers.length > 0) {
      await db.dungeonLoot.update({
        where: { id: goldLoot.id },
        data: {
          claimedBy: playerMembers[0].characterId, // Use first player as the "claimer"
          claimedAt: new Date(),
          distributionType: "GOLD_SPLIT",
        },
      });
    }

    // Log NPC share
    if (npcShare > 0) {
      console.log(
        `💰 ${npcShare} gold allocated to ${npcMembers.length} NPCs (not distributed)`
      );
    }
  }

  /**
   * Assign loot to a specific character
   */
  private static async assignLootToCharacter(
    loot: any,
    characterId: string
  ): Promise<void> {
    // Check if character already has this item
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
  }

  /**
   * Get the character for solo missions
   */
  private static async getSoloCharacter(session: any): Promise<any> {
    const recentAction = await db.dungeonPlayerAction.findFirst({
      where: {
        event: { sessionId: session.id },
      },
      include: { character: true },
      orderBy: { submittedAt: "desc" },
    });

    return recentAction?.character;
  }

  /**
   * Submit a Need/Greed roll for an item
   */
  static async submitLootRoll(
    lootId: string,
    characterId: string,
    rollType: "NEED" | "GREED"
  ): Promise<LootDistributionResult> {
    console.log(
      `🎲 Character ${characterId} rolling ${rollType} for loot ${lootId}`
    );

    // Check if character already rolled for this item
    const existingRoll = await db.lootRoll.findUnique({
      where: {
        lootId_characterId: {
          lootId,
          characterId,
        },
      },
    });

    if (existingRoll) {
      return {
        success: false,
        message: "You have already rolled for this item",
        error: "Already rolled",
      };
    }

    // Generate roll value
    const rollValue =
      rollType === "NEED" ? 100 : Math.floor(Math.random() * 100) + 1;

    // Create the roll
    await db.lootRoll.create({
      data: {
        lootId,
        characterId,
        rollType,
        rollValue,
      },
    });

    console.log(`🎲 ${rollType} roll: ${rollValue}`);

    // Check if all party members have rolled
    const loot = await db.dungeonLoot.findUnique({
      where: { id: lootId },
      include: {
        session: {
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
        },
        lootRolls: true,
      },
    });

    if (!loot || !loot.session.party) {
      return {
        success: false,
        message: "Loot or party not found",
        error: "Not found",
      };
    }

    const partyMembers = loot.session.party.members.map(
      (m: any) => m.character
    );
    const totalRolls = loot.lootRolls.length + 1; // +1 for the roll we just created

    if (totalRolls >= partyMembers.length) {
      // All members have rolled, determine winner
      return await this.determineLootWinner(lootId);
    }

    return {
      success: true,
      message: `Roll submitted. Waiting for ${
        partyMembers.length - totalRolls
      } more rolls.`,
    };
  }

  /**
   * Determine the winner of a loot roll
   */
  private static async determineLootWinner(
    lootId: string
  ): Promise<LootDistributionResult> {
    console.log(`🏆 Determining winner for loot ${lootId}`);

    const loot = await db.dungeonLoot.findUnique({
      where: { id: lootId },
      include: {
        lootRolls: {
          include: {
            character: true,
          },
          orderBy: [
            { rollType: "desc" }, // NEED comes before GREED
            { rollValue: "desc" }, // Higher values win
          ],
        },
      },
    });

    if (!loot || loot.lootRolls.length === 0) {
      return {
        success: false,
        message: "No rolls found for this loot",
        error: "No rolls",
      };
    }

    // The first roll in the ordered list is the winner
    const winner = loot.lootRolls[0];

    // Assign loot to winner
    await this.assignLootToCharacter(loot, winner.characterId);

    // Update loot record
    await db.dungeonLoot.update({
      where: { id: lootId },
      data: {
        assignedTo: winner.characterId,
        assignedAt: new Date(),
      },
    });

    console.log(
      `🏆 ${winner.character.name} won the loot with ${winner.rollType} roll of ${winner.rollValue}`
    );

    return {
      success: true,
      message: `${winner.character.name} won the loot with ${winner.rollType} roll of ${winner.rollValue}`,
      assignedLoot: [
        {
          ...loot,
          winner: winner.character,
          winningRoll: winner,
        },
      ],
    };
  }

  /**
   * Assign loot manually (Master Looter)
   */
  static async assignLootManually(
    lootId: string,
    characterId: string,
    masterLooterId: string
  ): Promise<LootDistributionResult> {
    console.log(
      `👑 Master Looter ${masterLooterId} assigning loot ${lootId} to ${characterId}`
    );

    const loot = await db.dungeonLoot.findUnique({
      where: { id: lootId },
      include: {
        session: {
          include: {
            party: true,
          },
        },
      },
    });

    if (!loot) {
      return {
        success: false,
        message: "Loot not found",
        error: "Not found",
      };
    }

    // Verify the master looter has permission
    if (
      loot.session.party?.masterLooterId !== masterLooterId &&
      loot.session.party?.leaderId !== masterLooterId
    ) {
      return {
        success: false,
        message: "You are not authorized to assign this loot",
        error: "Unauthorized",
      };
    }

    // Assign loot to character
    await this.assignLootToCharacter(loot, characterId);

    // Update loot record
    await db.dungeonLoot.update({
      where: { id: lootId },
      data: {
        assignedTo: characterId,
        assignedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Loot assigned to character ${characterId}`,
    };
  }

  /**
   * Get loot distribution status for a session
   */
  static async getLootDistributionStatus(sessionId: string): Promise<any> {
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
      },
    });

    if (!session) {
      return null;
    }

    const unclaimedLoot = await db.dungeonLoot.findMany({
      where: {
        sessionId,
        claimedBy: null,
      },
      include: {
        item: true,
        lootRolls: {
          include: {
            character: true,
          },
        },
      },
    });

    return {
      session,
      unclaimedLoot,
      distributionType: session.party?.lootDistributionType || "AUTO",
      masterLooterId: session.party?.masterLooterId || session.party?.leaderId,
    };
  }
}
