import { db } from "@/lib/db";
import { EventSpawner } from "./eventSpawner";
import { RewardService } from "./rewardService";

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
              },
            },
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
    const now = new Date();

    // Check if mission has timed out
    if (session.missionEndTime && now >= session.missionEndTime) {
      await this.handleMissionTimeout(session);
      return;
    }

    // Check if all party members are dead
    if (session.party) {
      const aliveMembers = session.party.members.filter(
        (member: any) => member.character.currentHealth > 0
      );

      if (aliveMembers.length === 0) {
        await this.handleMissionFailure(session, "All party members are dead");
        return;
      }
    } else {
      // Solo mission - for now, skip character health check
      // TODO: Implement proper solo mission character tracking
      // This would require adding a characterId field to DungeonSession
      // or creating a separate table to track character-session relationships
    }

    // Check if it's time to spawn an event
    console.log(
      `🔍 Checking event spawn for session ${session.id}, status: ${session.status}, nextSpawnTime: ${session.nextEventSpawnTime}`
    );
    if (await EventSpawner.checkForEventSpawn(session.id)) {
      console.log(`🎲 Spawning event for session ${session.id}`);
      await EventSpawner.spawnEvent(session.id);
    }

    // Check for abandoned missions (no activity for 10+ minutes)
    const lastActivity = session.updatedAt;
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    const tenMinutes = 10 * 60 * 1000;

    if (timeSinceActivity > tenMinutes) {
      await this.handleMissionAbandonment(session);
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
        completedAt: new Date(),
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
        completedAt: new Date(),
      },
    });

    console.log(`✅ Mission ${session.id} status updated to FAILED`);

    // Rollback incomplete rewards
    await RewardService.rollbackIncompleteRewards(session.id);

    // Notify party members
    await this.notifyMissionFailure(session, reason);
  }

  /**
   * Handle mission abandonment
   */
  private static async handleMissionAbandonment(session: any): Promise<void> {
    console.log(`🚪 Mission ${session.id} abandoned due to inactivity`);

    await db.dungeonSession.update({
      where: { id: session.id },
      data: {
        status: "ABANDONED",
        completedAt: new Date(),
      },
    });

    // Rollback incomplete rewards
    await RewardService.rollbackIncompleteRewards(session.id);

    // Notify party members
    await this.notifyMissionFailure(
      session,
      "Mission abandoned due to inactivity"
    );
  }

  /**
   * Handle mission completion
   */
  static async handleMissionCompletion(sessionId: string): Promise<void> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true },
    });

    if (!session) {
      return;
    }

    console.log(`🎉 Mission ${sessionId} completed successfully`);

    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Apply mission completion rewards
    await RewardService.applyMissionCompletionRewards(sessionId);

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
   * Notify party members of mission success
   */
  private static async notifyMissionSuccess(session: any): Promise<void> {
    // This would integrate with WebSocket to notify clients
    console.log(`📢 Notifying party of mission success`);

    // TODO: Implement WebSocket notification
    // WebSocketService.broadcastToParty(session.partyId, {
    //   type: "mission_completed",
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

    // Initialize event spawning
    console.log(`🎯 Initializing event spawning for mission ${sessionId}`);
    await EventSpawner.initializeMission(sessionId);

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
    currentEventId: string | null;
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
      currentEventId: session.currentEventId,
    };
  }

  /**
   * Pause mission timer (for events)
   */
  static async pauseMissionTimer(sessionId: string): Promise<void> {
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        pausedAt: new Date(),
      },
    });
  }

  /**
   * Resume mission timer (after events)
   */
  static async resumeMissionTimer(sessionId: string): Promise<void> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.pausedAt) {
      return;
    }

    const pauseDuration = Math.floor(
      (Date.now() - session.pausedAt.getTime()) / 1000
    );

    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        pausedAt: null,
        totalPausedTime: session.totalPausedTime + pauseDuration,
      },
    });
  }
}
