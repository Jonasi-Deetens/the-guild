import { db } from "@/lib/db";

export class DungeonSessionService {
  /**
   * Initialize party health at the start of a dungeon session
   * Sets currentHealth to maxHealth for all party members
   */
  async initializePartyHealth(sessionId: string): Promise<void> {
    console.log(
      "🏥 [DungeonSession] Initializing party health for session:",
      sessionId
    );

    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        party: {
          include: {
            characters: true,
          },
        },
      },
    });

    if (!session || !session.party) {
      console.log("🏥 [DungeonSession] No party found for session");
      return;
    }

    // Update currentHealth to maxHealth for all party members
    for (const character of session.party.characters) {
      await db.character.update({
        where: { id: character.id },
        data: {
          currentHealth: character.maxHealth,
        },
      });
    }

    console.log(
      "🏥 [DungeonSession] Initialized health for",
      session.party.characters.length,
      "party members"
    );
  }

  /**
   * Update party health after combat or other events
   */
  async updatePartyHealth(
    sessionId: string,
    healthUpdates: Record<string, number>
  ): Promise<void> {
    console.log("🏥 [DungeonSession] Updating party health:", healthUpdates);

    for (const [characterId, newHealth] of Object.entries(healthUpdates)) {
      await db.character.update({
        where: { id: characterId },
        data: {
          currentHealth: newHealth,
        },
      });
    }

    console.log(
      "🏥 [DungeonSession] Updated health for",
      Object.keys(healthUpdates).length,
      "characters"
    );
  }

  /**
   * Get current party health for a dungeon session
   */
  async getPartyHealth(sessionId: string): Promise<Record<string, number>> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        party: {
          include: {
            characters: true,
          },
        },
      },
    });

    if (!session || !session.party) {
      return {};
    }

    const healthMap: Record<string, number> = {};
    for (const character of session.party.characters) {
      healthMap[character.id] = character.currentHealth || character.maxHealth;
    }

    return healthMap;
  }

  /**
   * Heal a specific party member
   */
  async healPartyMember(
    characterId: string,
    amount: number
  ): Promise<{ newHealth: number; maxHealth: number }> {
    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const currentHealth = character.currentHealth || character.maxHealth;
    const newHealth = Math.min(currentHealth + amount, character.maxHealth);

    await db.character.update({
      where: { id: characterId },
      data: {
        currentHealth: newHealth,
      },
    });

    console.log(
      "🏥 [DungeonSession] Healed character",
      character.name,
      "for",
      amount,
      "HP"
    );

    return {
      newHealth,
      maxHealth: character.maxHealth,
    };
  }

  /**
   * Heal all party members in a session
   */
  async healAllPartyMembers(
    sessionId: string,
    amount: number
  ): Promise<Record<string, number>> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        party: {
          include: {
            characters: true,
          },
        },
      },
    });

    if (!session || !session.party) {
      return {};
    }

    const healthUpdates: Record<string, number> = {};

    for (const character of session.party.characters) {
      const currentHealth = character.currentHealth || character.maxHealth;
      const newHealth = Math.min(currentHealth + amount, character.maxHealth);

      await db.character.update({
        where: { id: character.id },
        data: {
          currentHealth: newHealth,
        },
      });

      healthUpdates[character.id] = newHealth;
    }

    console.log(
      "🏥 [DungeonSession] Healed all party members for",
      amount,
      "HP"
    );

    return healthUpdates;
  }

  /**
   * Get party member details with current health
   */
  async getPartyMembersWithHealth(sessionId: string): Promise<
    Array<{
      id: string;
      name: string;
      currentHealth: number;
      maxHealth: number;
      attack: number;
      defense: number;
      agility: number;
      blockStrength: number;
    }>
  > {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        party: {
          include: {
            characters: true,
          },
        },
      },
    });

    if (!session || !session.party) {
      return [];
    }

    return session.party.characters.map((character) => ({
      id: character.id,
      name: character.name,
      currentHealth: character.currentHealth || character.maxHealth,
      maxHealth: character.maxHealth,
      attack: character.attack,
      defense: character.defense,
      agility: character.agility,
      blockStrength: character.blockStrength,
    }));
  }

  /**
   * Check if any party members are dead (currentHealth <= 0)
   */
  async hasDeadPartyMembers(sessionId: string): Promise<boolean> {
    const partyMembers = await this.getPartyMembersWithHealth(sessionId);
    return partyMembers.some((member) => member.currentHealth <= 0);
  }

  /**
   * Get alive party members only
   */
  async getAlivePartyMembers(sessionId: string): Promise<
    Array<{
      id: string;
      name: string;
      currentHealth: number;
      maxHealth: number;
      attack: number;
      defense: number;
      agility: number;
      blockStrength: number;
    }>
  > {
    const partyMembers = await this.getPartyMembersWithHealth(sessionId);
    return partyMembers.filter((member) => member.currentHealth > 0);
  }

  /**
   * Reset party health to full at the end of a dungeon session
   */
  async resetPartyHealthToFull(sessionId: string): Promise<void> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        party: {
          include: {
            characters: true,
          },
        },
      },
    });

    if (!session || !session.party) {
      return;
    }

    for (const character of session.party.characters) {
      await db.character.update({
        where: { id: character.id },
        data: {
          currentHealth: character.maxHealth,
        },
      });
    }

    console.log("🏥 [DungeonSession] Reset all party members to full health");
  }
}

// Export singleton instance
export const dungeonSessionService = new DungeonSessionService();
