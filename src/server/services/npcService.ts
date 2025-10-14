import { db } from "@/lib/db";

export interface NPCCompanion {
  id: string;
  name: string;
  level: number;
  class: string;
  description?: string;
  backstory?: string;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  agility: number;
  perception: number;
  blockStrength: number;
  criticalChance: number;
  hireCost: number;
  unlockType: "GOLD" | "MILESTONE";
  unlockRequirement?: number;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  abilities?: any;
}

export interface HireResult {
  success: boolean;
  message: string;
  npc?: NPCCompanion;
  error?: string;
}

export class NPCService {
  /**
   * Get all available NPCs for a character
   */
  static async getAvailableNPCs(characterId: string): Promise<NPCCompanion[]> {
    const character = await db.character.findUnique({
      where: { id: characterId },
      select: { level: true, reputation: true },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const npcs = await db.nPCCompanion.findMany({
      orderBy: [
        { unlockType: "asc" }, // GOLD first, then MILESTONE
        { rarity: "asc" },
        { level: "asc" },
      ],
    });

    // Filter NPCs based on unlock requirements
    return npcs.filter((npc) => {
      if (npc.unlockType === "GOLD") {
        return true; // All gold NPCs are available
      } else if (npc.unlockType === "MILESTONE") {
        // Check if character meets the requirement
        if (npc.unlockRequirement) {
          return character.reputation >= npc.unlockRequirement;
        }
        return true;
      }
      return false;
    });
  }

  /**
   * Get NPCs that the character has unlocked (milestone NPCs)
   */
  static async getUnlockedNPCs(characterId: string): Promise<NPCCompanion[]> {
    const unlockedNPCs = await db.unlockedNPC.findMany({
      where: { characterId },
      include: { npcCompanion: true },
    });

    return unlockedNPCs.map((unlocked) => unlocked.npcCompanion);
  }

  /**
   * Hire an NPC for a mission
   */
  static async hireNPC(
    characterId: string,
    npcId: string,
    sessionId?: string
  ): Promise<HireResult> {
    try {
      // Get character and NPC
      const character = await db.character.findUnique({
        where: { id: characterId },
        select: { gold: true, partyId: true },
      });

      const npc = await db.nPCCompanion.findUnique({
        where: { id: npcId },
      });

      if (!character) {
        return { success: false, message: "Character not found" };
      }

      if (!npc) {
        return { success: false, message: "NPC not found" };
      }

      // Check if character has enough gold (for gold NPCs)
      if (npc.unlockType === "GOLD" && character.gold < npc.hireCost) {
        return {
          success: false,
          message: `Not enough gold. Need ${npc.hireCost}, have ${character.gold}`,
        };
      }

      // Check if character is in a party
      if (!character.partyId) {
        return {
          success: false,
          message: "Character must be in a party to hire NPCs",
        };
      }

      // Check if party has space
      const party = await db.party.findUnique({
        where: { id: character.partyId },
        include: { members: true },
      });

      if (!party) {
        return { success: false, message: "Party not found" };
      }

      if (party.members.length >= party.maxMembers) {
        return { success: false, message: "Party is full" };
      }

      // Check if NPC is already hired
      const existingHire = await db.hiredNPC.findFirst({
        where: {
          characterId,
          npcCompanionId: npcId,
          sessionId: sessionId || null,
        },
      });

      if (existingHire) {
        return {
          success: false,
          message: "NPC is already hired for this session",
        };
      }

      // For milestone NPCs, check if they're unlocked
      if (npc.unlockType === "MILESTONE") {
        const isUnlocked = await db.unlockedNPC.findUnique({
          where: {
            characterId_npcCompanionId: {
              characterId,
              npcCompanionId: npcId,
            },
          },
        });

        if (!isUnlocked) {
          return { success: false, message: "This NPC is not unlocked yet" };
        }
      }

      // Deduct gold if it's a gold NPC
      if (npc.unlockType === "GOLD") {
        await db.character.update({
          where: { id: characterId },
          data: { gold: character.gold - npc.hireCost },
        });
      }

      // Create hired NPC record
      const hiredNPC = await db.hiredNPC.create({
        data: {
          characterId,
          npcCompanionId: npcId,
          sessionId: sessionId || null,
          expiresAt: sessionId
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : null, // 24 hours
        },
      });

      // Add NPC to party as a party member
      // For NPCs, we use null for characterId since they don't have a character record
      await db.partyMember.create({
        data: {
          partyId: character.partyId,
          characterId: null, // NPCs don't have a character record
          isNPC: true,
          npcCompanionId: npcId,
          isReady: true, // NPCs are always ready
        },
      });

      return {
        success: true,
        message: `Successfully hired ${npc.name} for ${npc.hireCost} gold`,
        npc,
      };
    } catch (error) {
      console.error("Error hiring NPC:", error);
      return {
        success: false,
        message: "Failed to hire NPC",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Dismiss an NPC from the party
   */
  static async dismissNPC(
    characterId: string,
    npcId: string
  ): Promise<HireResult> {
    try {
      // Remove from party
      const partyMember = await db.partyMember.findFirst({
        where: {
          characterId: null, // NPCs have null characterId
          npcCompanionId: npcId,
          isNPC: true,
        },
      });

      if (partyMember) {
        await db.partyMember.delete({
          where: { id: partyMember.id },
        });
      }

      // Remove hired NPC record
      await db.hiredNPC.deleteMany({
        where: {
          characterId,
          npcCompanionId: npcId,
        },
      });

      const npc = await db.nPCCompanion.findUnique({
        where: { id: npcId },
      });

      return {
        success: true,
        message: `Successfully dismissed ${npc?.name || "NPC"}`,
        npc: npc || undefined,
      };
    } catch (error) {
      console.error("Error dismissing NPC:", error);
      return {
        success: false,
        message: "Failed to dismiss NPC",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Unlock a milestone NPC for a character
   */
  static async unlockMilestoneNPC(
    characterId: string,
    npcId: string
  ): Promise<HireResult> {
    try {
      const npc = await db.nPCCompanion.findUnique({
        where: { id: npcId },
      });

      if (!npc) {
        return { success: false, message: "NPC not found" };
      }

      if (npc.unlockType !== "MILESTONE") {
        return { success: false, message: "This NPC is not a milestone NPC" };
      }

      // Check if already unlocked
      const existing = await db.unlockedNPC.findUnique({
        where: {
          characterId_npcCompanionId: {
            characterId,
            npcCompanionId: npcId,
          },
        },
      });

      if (existing) {
        return { success: false, message: "NPC is already unlocked" };
      }

      // Create unlocked NPC record
      await db.unlockedNPC.create({
        data: {
          characterId,
          npcCompanionId: npcId,
        },
      });

      return {
        success: true,
        message: `Successfully unlocked ${npc.name}`,
        npc,
      };
    } catch (error) {
      console.error("Error unlocking NPC:", error);
      return {
        success: false,
        message: "Failed to unlock NPC",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check and unlock milestone NPCs based on character progress
   */
  static async checkUnlockRequirements(
    characterId: string
  ): Promise<NPCCompanion[]> {
    try {
      const character = await db.character.findUnique({
        where: { id: characterId },
        select: { level: true, reputation: true },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Find milestone NPCs that can be unlocked
      const unlockableNPCs = await db.nPCCompanion.findMany({
        where: {
          unlockType: "MILESTONE",
          unlockRequirement: {
            lte: character.reputation,
          },
        },
      });

      const newlyUnlocked: NPCCompanion[] = [];

      for (const npc of unlockableNPCs) {
        // Check if already unlocked
        const existing = await db.unlockedNPC.findUnique({
          where: {
            characterId_npcCompanionId: {
              characterId,
              npcCompanionId: npc.id,
            },
          },
        });

        if (!existing) {
          // Unlock the NPC
          await db.unlockedNPC.create({
            data: {
              characterId,
              npcCompanionId: npc.id,
            },
          });

          newlyUnlocked.push(npc);
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error("Error checking unlock requirements:", error);
      return [];
    }
  }

  /**
   * Get NPCs currently hired by a character
   */
  static async getHiredNPCs(characterId: string): Promise<NPCCompanion[]> {
    const hiredNPCs = await db.hiredNPC.findMany({
      where: { characterId },
      include: { npcCompanion: true },
    });

    return hiredNPCs.map((hired) => hired.npcCompanion);
  }

  /**
   * Clean up expired NPC hires
   */
  static async cleanupExpiredHires(): Promise<void> {
    const expiredHires = await db.hiredNPC.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    for (const hire of expiredHires) {
      // Remove from party
      await db.partyMember.deleteMany({
        where: {
          characterId: null, // NPCs have null characterId
          npcCompanionId: hire.npcCompanionId,
          isNPC: true,
        },
      });

      // Remove hire record
      await db.hiredNPC.delete({
        where: { id: hire.id },
      });
    }

    if (expiredHires.length > 0) {
      console.log(`🧹 Cleaned up ${expiredHires.length} expired NPC hires`);
    }
  }
}
