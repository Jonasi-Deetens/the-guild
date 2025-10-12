import { db } from "@/lib/db";
import { EventType, EventStatus } from "@prisma/client";

export interface EventSpawnConfig {
  missionId: string;
  sessionId: string;
  difficulty: number;
  minEventInterval: number;
  maxEventInterval: number;
}

export class EventSpawner {
  /**
   * Calculate the next event spawn time based on mission configuration
   */
  static calculateNextSpawnTime(
    minInterval: number,
    maxInterval: number
  ): Date {
    const randomInterval = Math.floor(
      Math.random() * (maxInterval - minInterval + 1) + minInterval
    );
    return new Date(Date.now() + randomInterval * 1000);
  }

  /**
   * Check if it's time to spawn the next event for a mission
   */
  static async checkForEventSpawn(sessionId: string): Promise<boolean> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true },
    });

    if (!session || session.status !== "ACTIVE") {
      return false;
    }

    // Don't spawn if there's already an active event
    if (session.currentEventId) {
      return false;
    }

    // Check if we have a next spawn time and if it's time to spawn
    if (!session.nextEventSpawnTime) {
      // Initialize the spawn time if it's missing
      const firstSpawnTime = this.calculateNextSpawnTime(
        session.mission.minEventInterval,
        session.mission.maxEventInterval
      );

      await db.dungeonSession.update({
        where: { id: sessionId },
        data: {
          nextEventSpawnTime: firstSpawnTime,
        },
      });

      return false; // Don't spawn immediately, wait for next check
    }

    const now = new Date();
    if (now >= session.nextEventSpawnTime) {
      return true;
    }

    return false;
  }

  /**
   * Spawn a random event for the mission
   */
  static async spawnEvent(sessionId: string): Promise<string | null> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true, events: true },
    });

    if (!session || session.status !== "ACTIVE") {
      return null;
    }

    // Don't spawn if there's already an active event
    if (session.currentEventId) {
      return null;
    }

    // Select random event type based on difficulty
    const eventType = this.selectRandomEventType(session.mission.difficulty);

    // Get available event templates for this type
    const templates = await db.eventTemplate.findMany({
      where: {
        type: eventType,
        difficulty: {
          lte: session.mission.difficulty,
        },
      },
    });

    if (templates.length === 0) {
      console.warn(
        `No event templates found for type ${eventType} and difficulty ${session.mission.difficulty}`
      );
      return null;
    }

    // Select random template
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Generate fresh event data
    const eventData = this.generateEventData(
      template,
      session.mission.difficulty
    );

    // Create the event
    const event = await db.dungeonEvent.create({
      data: {
        sessionId: sessionId,
        templateId: template.id,
        eventNumber: session.events.length + 1,
        status: "ACTIVE",
        eventData: eventData,
        startsAt: new Date(),
      },
    });

    console.log(`🎲 Created fresh event:`, {
      id: event.id,
      eventNumber: event.eventNumber,
      status: event.status,
      hasPlayerActions: false, // Fresh events should have no player actions
    });

    // Update session to pause timer and set current event
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        currentEventId: event.id,
        pausedAt: new Date(),
        nextEventSpawnTime: null, // Will be set when event completes
      },
    });

    console.log(`🎲 Spawned ${eventType} event for session ${sessionId}`);
    return event.id;
  }

  /**
   * Complete an event and schedule the next one
   */
  static async completeEvent(
    sessionId: string,
    eventId: string
  ): Promise<void> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true },
    });

    if (!session) {
      return;
    }

    // Update event status
    await db.dungeonEvent.update({
      where: { id: eventId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Calculate pause duration and add to total
    const pauseDuration = session.pausedAt
      ? Math.floor((Date.now() - session.pausedAt.getTime()) / 1000)
      : 0;

    // Calculate next spawn time
    const nextSpawnTime = this.calculateNextSpawnTime(
      session.mission.minEventInterval,
      session.mission.maxEventInterval
    );

    // Update session to resume timer
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        currentEventId: null,
        pausedAt: null,
        totalPausedTime: session.totalPausedTime + pauseDuration,
        nextEventSpawnTime: nextSpawnTime,
      },
    });

    console.log(
      `✅ EventSpawner.completeEvent - cleared currentEventId, set nextSpawnTime: ${nextSpawnTime.toISOString()}`
    );

    console.log(
      `✅ Completed event ${eventId} for session ${sessionId}, next spawn at ${nextSpawnTime.toISOString()}`
    );
  }

  /**
   * Select a random event type based on mission difficulty
   */
  private static selectRandomEventType(difficulty: number): EventType {
    const eventWeights = this.getEventWeights(difficulty);
    const totalWeight = eventWeights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (let i = 0; i < eventWeights.length; i++) {
      currentWeight += eventWeights[i];
      if (random <= currentWeight) {
        return Object.values(EventType)[i] as EventType;
      }
    }

    // Fallback to COMBAT
    return EventType.COMBAT;
  }

  /**
   * Get event type weights based on difficulty
   */
  private static getEventWeights(difficulty: number): number[] {
    // Higher difficulty = more combat and boss events
    const baseWeights = {
      [EventType.COMBAT]: 30,
      [EventType.TREASURE]: 20,
      [EventType.TRAP]: 15,
      [EventType.PUZZLE]: 10,
      [EventType.CHOICE]: 10,
      [EventType.REST]: 5,
      [EventType.BOSS]: 0,
      [EventType.BETRAYAL_OPPORTUNITY]: 5,
      [EventType.NPC_ENCOUNTER]: 5,
      [EventType.ENVIRONMENTAL_HAZARD]: 0,
    };

    // Adjust weights based on difficulty
    if (difficulty >= 4) {
      baseWeights[EventType.BOSS] = 15;
      baseWeights[EventType.COMBAT] = 40;
      baseWeights[EventType.ENVIRONMENTAL_HAZARD] = 10;
    }

    if (difficulty >= 5) {
      baseWeights[EventType.BOSS] = 25;
      baseWeights[EventType.COMBAT] = 35;
      baseWeights[EventType.ENVIRONMENTAL_HAZARD] = 15;
    }

    return Object.values(baseWeights);
  }

  /**
   * Generate event-specific data based on template and difficulty
   */
  private static generateEventData(template: any, difficulty: number): any {
    const baseData = {
      difficulty: difficulty,
      timestamp: new Date().toISOString(),
    };

    switch (template.type) {
      case EventType.COMBAT:
        return {
          ...baseData,
          enemyCount: Math.min(3, Math.floor(difficulty / 2) + 1),
          enemyLevel: difficulty * 2,
        };

      case EventType.TREASURE:
        return {
          ...baseData,
          goldAmount: difficulty * 10 + Math.floor(Math.random() * 50),
          itemChance: Math.min(0.3, difficulty * 0.05),
        };

      case EventType.TRAP:
        return {
          ...baseData,
          damage: difficulty * 5 + Math.floor(Math.random() * 20),
          disarmChance: Math.max(0.1, 0.8 - difficulty * 0.1),
        };

      case EventType.PUZZLE:
        return {
          ...baseData,
          complexity: difficulty,
          timeLimit: 60 + difficulty * 10,
        };

      case EventType.CHOICE:
        return {
          ...baseData,
          options: 3 + Math.floor(difficulty / 2),
        };

      case EventType.REST:
        return {
          ...baseData,
          healingAmount: 20 + difficulty * 5,
        };

      case EventType.BOSS:
        return {
          ...baseData,
          bossLevel: difficulty * 3,
          specialAbilities: difficulty,
        };

      case EventType.ENVIRONMENTAL_HAZARD:
        return {
          ...baseData,
          severity: difficulty,
          damage: difficulty * 8,
        };

      default:
        return baseData;
    }
  }

  /**
   * Check if an event type should pause the mission timer
   */
  static shouldPauseTimer(eventType: EventType): boolean {
    const pauseEvents = [
      EventType.COMBAT,
      EventType.BOSS,
      EventType.PUZZLE,
      EventType.TRAP,
      EventType.ENVIRONMENTAL_HAZARD,
    ];

    return pauseEvents.includes(eventType);
  }

  /**
   * Initialize event spawning for a new mission
   */
  static async initializeMission(sessionId: string): Promise<void> {
    console.log(
      `🎯 EventSpawner.initializeMission called for session ${sessionId}`
    );

    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true },
    });

    if (!session) {
      console.log(
        `❌ EventSpawner.initializeMission - session not found: ${sessionId}`
      );
      return;
    }

    console.log(
      `🎯 EventSpawner.initializeMission - session found, mission: ${session.mission.name}, minInterval: ${session.mission.minEventInterval}, maxInterval: ${session.mission.maxEventInterval}`
    );

    // Calculate first event spawn time
    const firstSpawnTime = this.calculateNextSpawnTime(
      session.mission.minEventInterval,
      session.mission.maxEventInterval
    );

    console.log(
      `🎯 EventSpawner.initializeMission - calculated first spawn time: ${firstSpawnTime.toISOString()}`
    );

    // Update session with spawn time
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        nextEventSpawnTime: firstSpawnTime,
      },
    });

    console.log(
      `🎯 Initialized mission ${sessionId}, first event spawn at ${firstSpawnTime.toISOString()}`
    );
  }
}
