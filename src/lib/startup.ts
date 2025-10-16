import { MissionScheduler } from "@/server/services/missionScheduler";
import { ScheduledCleanupService } from "@/server/services/scheduledCleanupService";

let isInitialized = false;

export function initializeServices() {
  if (isInitialized) {
    console.log("Services already initialized");
    return;
  }

  console.log("🚀 Initializing mission system services...");

  // Start the mission scheduler
  MissionScheduler.start();

  // Start the scheduled cleanup service
  ScheduledCleanupService.start();

  isInitialized = true;
  console.log("✅ Mission system services initialized");
}

// Initialize services when this module is imported
if (typeof window === "undefined") {
  // Only run on server side
  initializeServices();
}
