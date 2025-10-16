import { MissionCleanupService } from "./missionCleanupService";

/**
 * Service for scheduled cleanup operations
 */
export class ScheduledCleanupService {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start the scheduled cleanup service
   * Runs cleanup every 5 minutes
   */
  static start(): void {
    if (this.isRunning) {
      console.log("🧹 [ScheduledCleanupService] Already running");
      return;
    }

    console.log(
      "🚀 [ScheduledCleanupService] Starting scheduled cleanup service"
    );
    this.isRunning = true;

    // Run cleanup immediately on start
    this.runCleanup();

    // Then run every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop the scheduled cleanup service
   */
  static stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log(
      "🛑 [ScheduledCleanupService] Stopped scheduled cleanup service"
    );
  }

  /**
   * Run the cleanup operation
   */
  private static async runCleanup(): Promise<void> {
    try {
      console.log("🧹 [ScheduledCleanupService] Running scheduled cleanup...");

      const result = await MissionCleanupService.cleanupExpiredMissions();

      if (result.cleanedSessions > 0) {
        console.log(
          `✅ [ScheduledCleanupService] Cleaned up ${result.cleanedSessions} expired sessions`
        );
      } else {
        console.log(
          "✅ [ScheduledCleanupService] No expired sessions to clean up"
        );
      }
    } catch (error) {
      console.error(
        "❌ [ScheduledCleanupService] Error during scheduled cleanup:",
        error
      );
    }
  }

  /**
   * Get the current status of the scheduled cleanup service
   */
  static getStatus(): {
    isRunning: boolean;
    nextCleanupIn?: number;
  } {
    return {
      isRunning: this.isRunning,
      // Note: We don't track the exact next cleanup time in this simple implementation
    };
  }

  /**
   * Force run cleanup immediately (for testing or manual triggers)
   */
  static async forceCleanup(): Promise<void> {
    console.log("🧹 [ScheduledCleanupService] Force running cleanup...");
    await this.runCleanup();
  }
}
