import { db } from "@/lib/db";
import { MissionScheduler } from "./missionScheduler";
import { CombatService } from "./combatService";

export interface DungeonAction {
  characterId: string;
  action: string;
  actionData?: any;
}

export interface DungeonResult {
  characterId: string;
  action: string;
  success: boolean;
  message: string;
  rewards?: any;
}

export class DungeonEngine {
  /**
   * Start a new mission session
   */
  async startMission(sessionId: string): Promise<void> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        mission: true,
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
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== "WAITING") {
      throw new Error(`Session ${sessionId} is not in WAITING state`);
    }

    // Use the mission scheduler to start the mission
    await MissionScheduler.startMission(sessionId);

    console.log(`🎯 Started mission ${sessionId}: ${session.mission.name}`);
  }

  /**
   * Submit an action (for phase-based system)
   */
  async submitEventAction(
    sessionId: string,
    characterId: string,
    action: string,
    actionData: any = {}
  ): Promise<DungeonResult> {
    // For phase-based system, we mainly handle combat actions
    if (action === "minigame_complete" || action === "MINIGAME_COMPLETE") {
      // Handle combat completion
      const session = await db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: { mission: true },
      });

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Get current character
      const character = await db.character.findUnique({
        where: { id: characterId },
      });

      if (!character) {
        throw new Error(`Character ${characterId} not found`);
      }

      // For now, just return success - the combat service handles the actual logic
      return {
        characterId,
        action,
        success: true,
        message: "Action processed successfully",
      };
    }

    // Default response for other actions
    return {
      characterId,
      action,
      success: true,
      message: "Action processed",
    };
  }
}
