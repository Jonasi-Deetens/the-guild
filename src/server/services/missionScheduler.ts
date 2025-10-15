import { db } from "@/lib/db";
import { PhaseManager } from "./phaseManager";
import { RewardService } from "./rewardService";
import { LootService } from "./lootService";

export class MissionScheduler {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the mission scheduler
   */
  static start(): void {
    if (this.isRunning) {
      console.log("Mission scheduler is already running");
      return;
    }

    console.log("🚀 Starting mission scheduler...");
    this.isRunning = true;

    // Run every 5 seconds
    this.intervalId = setInterval(async () => {
      try {
        await this.processActiveMissions();
      } catch (error) {
        console.error("Error in mission scheduler:", error);
      }
    }, 5000);
  }

  /**
   * Stop the mission scheduler
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🛑 Mission scheduler stopped");
  }

  /**
   * Process all active missions
   */
  private static async processActiveMissions(): Promise<void> {
    const activeMissions = await db.dungeonSession.findMany({
      where: { status: "ACTIVE" },
      include: {
        mission: true,
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
        phases: {
          orderBy: {
            phaseNumber: "asc",
          },
        },
      },
    });

    for (const session of activeMissions) {
      try {
        await this.processMission(session);
      } catch (error) {
        console.error(`Error processing mission ${session.id}:`, error);
      }
    }
  }

  /**
   * Process a single mission
   */
  private static async processMission(session: any): Promise<void> {
    // Double-check that the session is still ACTIVE (avoid race conditions)
    const currentSession = await db.dungeonSession.findUnique({
      where: { id: session.id },
      select: { status: true },
    });

    if (!currentSession || currentSession.status !== "ACTIVE") {
      console.log(
        `⏭️ Skipping mission ${session.id} - status is ${
          currentSession?.status || "not found"
        }`
      );
      return;
    }

    const now = new Date();

    // Check if mission time has expired
    if (session.missionEndTime && now >= session.missionEndTime) {
      console.log(
        `⏰ Mission ${
          session.id
        } timed out at ${now.toISOString()}, end time was ${session.missionEndTime.toISOString()}`
      );
      await this.handleMissionTimeout(session);
      return;
    }

    // Check if all players are dead
    if (await this.checkAllPlayersDead(session)) {
      console.log(
        `💀 Mission ${session.id} failed: All party members are dead`
      );
      await this.handleMissionFailure(session, "All party members are dead");
      return;
    }

    // Check for abandoned missions (no activity for 10+ minutes)
    const lastActivity = session.updatedAt;
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    const tenMinutes = 10 * 60 * 1000;

    if (timeSinceActivity > tenMinutes) {
      await this.handleMissionAbandonment(session);
    }

    // Phase-based progression logic
    await this.processPhaseProgression(session);
  }

  /**
   * Process phase progression for a mission
   */
  private static async processPhaseProgression(session: any): Promise<void> {
    const phaseData = await PhaseManager.getCurrentPhase(session.id);

    if (!phaseData || !phaseData.currentPhase) {
      console.log(`⚠️ No current phase found for session ${session.id}`);
      return;
    }

    const { currentPhase, allPhases } = phaseData;

    // If current phase is PENDING, start it
    if (currentPhase.status === "PENDING") {
      console.log(
        `🚀 Starting phase ${currentPhase.phaseNumber} for session ${session.id}`
      );
      await PhaseManager.startPhase(session.id, currentPhase.phaseNumber);
    }
    // If current phase is COMPLETED and not the final phase, start rest period
    else if (
      currentPhase.status === "COMPLETED" &&
      currentPhase.phaseNumber < session.mission.totalPhases
    ) {
      console.log(
        `😴 Starting rest period for phase ${currentPhase.phaseNumber}`
      );
      await PhaseManager.startRestPeriod(session.id, currentPhase.phaseNumber);
    }
    // If all phases are completed, finish the mission
    else if (await PhaseManager.checkMissionCompletion(session.id)) {
      console.log(`🎉 All phases completed for session ${session.id}`);
      await this.handleMissionSuccess(session);
    }
  }

  /**
   * Handle mission timeout
   */
  private static async handleMissionTimeout(session: any): Promise<void> {
    console.log(`⏰ Mission ${session.id} timed out`);

    await db.dungeonSession.update({
      where: { id: session.id },
      data: {
        status: "FAILED",
        missionEndTime: new Date(),
      },
    });

    console.log(`✅ Mission ${session.id} status updated to FAILED`);

    // Rollback incomplete rewards
    await RewardService.rollbackIncompleteRewards(session.id);

    // Notify party members
    await this.notifyMissionFailure(session, "Mission timed out");
  }

  /**
   * Handle mission failure
   */
  public static async handleMissionFailure(
    session: any,
    reason: string
  ): Promise<void> {
    console.log(`💀 Mission ${session.id} failed: ${reason}`);

    await db.dungeonSession.update({
      where: { id: session.id },
      data: {
        status: "FAILED",
        missionEndTime: new Date(),
      },
    });

    console.log(`✅ Mission ${session.id} status updated to FAILED`);

    // Rollback incomplete rewards
    await RewardService.rollbackIncompleteRewards(session.id);

    // Notify party members
    await this.notifyMissionFailure(session, reason);
  }

  /**
   * Handle mission success
   */
  private static async handleMissionSuccess(session: any): Promise<void> {
    console.log(`🎉 Mission ${session.id} completed successfully`);

    await db.dungeonSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        missionEndTime: new Date(),
      },
    });

    console.log(`✅ Mission ${session.id} status updated to COMPLETED`);

    // Apply rewards
    await RewardService.applyMissionCompletionRewards(session.id);

    // Generate loot
    await LootService.generateMissionLoot(session.id);

    // Notify party members
    await this.notifyMissionSuccess(session);
  }

  /**
   * Notify party members of mission failure
   */
  private static async notifyMissionFailure(
    session: any,
    reason: string
  ): Promise<void> {
    // This would integrate with WebSocket to notify clients
    console.log(`📢 Notifying party of mission failure: ${reason}`);

    // TODO: Implement WebSocket notification
    // WebSocketService.broadcastToParty(session.partyId, {
    //   type: "mission_failed",
    //   reason: reason,
    //   sessionId: session.id,
    // });
  }

  /**
   * Start a new mission
   */
  static async startMission(sessionId: string): Promise<void> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const now = new Date();
    const missionEndTime = new Date(
      now.getTime() + session.mission.baseDuration * 1000
    );

    // Update session to active state
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        status: "ACTIVE",
        missionStartTime: now,
        missionEndTime: missionEndTime,
        duration: session.mission.baseDuration,
      },
    });

    // Initialize phases for the mission
    console.log(`🎯 Initializing phases for mission ${sessionId}`);
    await PhaseManager.initializePhases(sessionId);

    console.log(
      `🎯 Started mission ${sessionId}, duration: ${
        session.mission.baseDuration
      }s, ends at ${missionEndTime.toISOString()}`
    );
  }

  /**
   * Get mission status and remaining time
   */
  static async getMissionStatus(sessionId: string): Promise<{
    status: string;
    remainingTime: number;
    isPaused: boolean;
  } | null> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    const now = new Date();
    let remainingTime = 0;
    let isPaused = false;

    if (session.status === "ACTIVE" && session.missionEndTime) {
      const elapsedTime = now.getTime() - session.missionStartTime!.getTime();
      const totalPausedTime = session.totalPausedTime * 1000;
      const effectiveElapsedTime = elapsedTime - totalPausedTime;

      remainingTime = Math.max(
        0,
        session.duration * 1000 - effectiveElapsedTime
      );
      isPaused = session.pausedAt !== null;
    }

    return {
      status: session.status,
      remainingTime: Math.floor(remainingTime / 1000),
      isPaused: isPaused,
    };
  }

  /**
   * Check if all players are dead
   */
  private static async checkAllPlayersDead(session: any): Promise<boolean> {
    if (session.party) {
      const aliveMembers = session.party.members.filter((member: any) => {
        // Handle both player characters and NPCs
        if (member.character) {
          // Player character
          return (
            member.character.currentHealth != null &&
            member.character.currentHealth > 0
          );
        } else if (member.npcCompanion) {
          // NPC companion
          return (
            member.npcCompanion.currentHealth != null &&
            member.npcCompanion.currentHealth > 0
          );
        }
        return false;
      });

      console.log(
        `🔍 [MissionScheduler] Party members check: total=${session.party.members.length}, alive=${aliveMembers.length}`
      );

      session.party.members.forEach((member: any) => {
        if (member.character) {
          console.log(
            `  - Player ${member.character.name}: health=${member.character.currentHealth}/${member.character.maxHealth}`
          );
        } else if (member.npcCompanion) {
          console.log(
            `  - NPC ${member.npcCompanion.name}: health=${member.npcCompanion.currentHealth}/${member.npcCompanion.maxHealth}`
          );
        }
      });

      return aliveMembers.length === 0;
    } else {
      // Solo mission - find the character from the session
      // For solo missions, we need to find the character through the party leader relationship
      const character = await db.character.findFirst({
        where: {
          ledParties: {
            some: {
              dungeonSessions: {
                some: {
                  id: session.id,
                },
              },
            },
          },
        },
      });

      if (character) {
        const isDead = character.currentHealth <= 0;
        console.log(`🔍 Solo mission death check:`, {
          sessionId: session.id,
          characterId: character.id,
          currentHealth: character.currentHealth,
          isDead: isDead,
        });
        return isDead;
      }

      // If no character found, assume alive
      console.log(
        `🔍 No character found for solo mission ${session.id}, assuming alive`
      );
      return false;
    }
  }

  /**
   * Notify party members of mission success
   */
  private static async notifyMissionSuccess(
    session: any,
    reason: string
  ): Promise<void> {
    // TODO: Implement WebSocket notification for mission success
    console.log(`📢 Mission ${session.id} success notification: ${reason}`);
  }
}
