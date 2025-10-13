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

    // Check mission type specific logic
    if (session.mission.missionType === "CLEAR") {
      // For CLEAR missions, check if timer expired -> spawn boss
      if (session.missionEndTime && now >= session.missionEndTime) {
        await this.handleClearMissionTimeout(session);
        return;
      }

      // Check fail condition
      if (session.mission.failCondition === "DEATH_ONLY") {
        if (await this.checkAllPlayersDead(session)) {
          await this.handleMissionFailure(session, "All players died");
          return;
        }
      }
    } else {
      // TIMED missions - original logic
      if (session.missionEndTime && now >= session.missionEndTime) {
        await this.handleMissionTimeout(session);
        return;
      }

      if (await this.checkAllPlayersDead(session)) {
        await this.handleMissionFailure(session, "All party members are dead");
        return;
      }
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
    await this.notifyMissionSuccess(session, "Mission completed successfully");
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

  /**
   * Handle CLEAR mission timeout (spawn boss instead of failing)
   */
  private static async handleClearMissionTimeout(session: any): Promise<void> {
    console.log(`⏰ CLEAR Mission ${session.id} timer expired - spawning boss`);

    // Check if boss is already spawned or mission is already completed
    if (session.status === "COMPLETED" || session.status === "FAILED") {
      console.log(
        `⏰ Mission ${session.id} already completed/failed, skipping boss spawn`
      );
      return;
    }

    if (session.mission.bossTemplateId) {
      const { EventSpawner } = await import("./eventSpawner");
      await EventSpawner.spawnBossEvent(
        session.id,
        session.mission.bossTemplateId
      );
    } else {
      // No boss template - complete mission as success
      await this.handleMissionSuccess(
        session,
        "Mission completed - no boss to fight"
      );
    }
  }

  /**
   * Check if all players are dead
   */
  private static async checkAllPlayersDead(session: any): Promise<boolean> {
    if (session.party) {
      const aliveMembers = session.party.members.filter(
        (member: any) => member.character.currentHealth > 0
      );
      return aliveMembers.length === 0;
    } else {
      // Solo mission - check if the character is dead
      // Find the character by looking at recent player actions
      const recentAction = await db.dungeonPlayerAction.findFirst({
        where: {
          event: { sessionId: session.id },
        },
        include: { character: true },
        orderBy: { submittedAt: "desc" },
      });

      if (recentAction?.character) {
        const isDead = recentAction.character.currentHealth <= 0;
        console.log(`🔍 Solo mission death check:`, {
          sessionId: session.id,
          characterId: recentAction.character.id,
          currentHealth: recentAction.character.currentHealth,
          isDead: isDead,
        });
        return isDead;
      }

      return false;
    }
  }

  /**
   * Handle mission success
   */
  public static async handleMissionSuccess(
    session: any,
    reason: string
  ): Promise<void> {
    console.log(`✅ Mission ${session.id} completed successfully: ${reason}`);
    console.log(`🔍 handleMissionSuccess called with session:`, {
      id: session.id,
      status: session.status,
      missionId: session.missionId,
    });

    await db.dungeonSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Apply final rewards
    const { RewardService } = await import("./rewardService");
    await RewardService.applyMissionCompletionRewards(session.id);

    // Notify party members
    await this.notifyMissionSuccess(session, reason);
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
