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
      include: {
        mission: true,
        events: {
          where: { status: { in: ["PENDING", "ACTIVE"] } },
          orderBy: { eventNumber: "asc" },
        },
      },
    });

    if (!session || session.status !== "ACTIVE") {
      return false;
    }

    // Don't spawn if there's an active event
    if (session.currentEventId) {
      console.log(
        `⏸️ Event ${session.currentEventId} is active, skipping spawn`
      );
      return false;
    }

    // Don't spawn if mission is paused
    if (session.pausedAt) {
      console.log(`⏸️ Mission is paused, skipping spawn`);
      return false;
    }

    // Check if there are any PENDING events that should be activated
    const pendingEvents = session.events.filter(
      (event) => event.status === "PENDING"
    );
    if (pendingEvents.length > 0) {
      // Activate the next pending event instead of creating a new one
      const nextEvent = pendingEvents[0];
      await this.activatePendingEvent(sessionId, nextEvent.id);
      return false; // Don't create a new event
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
   * Activate a pending event instead of creating a new one
   */
  static async activatePendingEvent(
    sessionId: string,
    eventId: string
  ): Promise<void> {
    console.log(
      `🔄 Activating pending event ${eventId} for session ${sessionId}`
    );

    // Get the event with its template
    const event = await db.dungeonEvent.findUnique({
      where: { id: eventId },
      include: { template: true },
    });

    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    // Generate monsters for combat events
    let updatedEventData = event.eventData;
    if (event.template?.type === "COMBAT") {
      console.log(`🎯 Generating monsters for combat event ${eventId}`);
      const monsters = await this.generateMonstersForEvent(event.template);

      // Add initial combat state with generated monsters
      const combatState = {
        monsters: monsters,
        turnCount: 0,
        playerDamageDealt: 0,
        enemyDamageDealt: {}, // Should be Record<string, number>, not a number
        monstersDefeated: 0,
        partyHealthUpdates: {},
      };

      updatedEventData = {
        ...event.eventData,
        combatState: combatState,
      };
    }

    // Update the event status to ACTIVE with generated monsters
    await db.dungeonEvent.update({
      where: { id: eventId },
      data: {
        status: "ACTIVE",
        startsAt: new Date(),
        eventData: updatedEventData,
      },
    });

    // Update session to set this as the current event and pause timer
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        currentEventId: eventId,
        pausedAt: new Date(),
        nextEventSpawnTime: null, // Will be set when event completes
      },
    });

    console.log(
      `✅ Activated pending event ${eventId} for session ${sessionId}`
    );
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

    // Before creating event, pause timer
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        pausedAt: new Date(),
        currentEventId: null, // Will be set after event creation
      },
    });

    // Get allowed event templates for this mission
    const allowedEventMappings = await db.missionEventTemplate.findMany({
      where: { missionId: session.mission.id },
      include: { eventTemplate: true },
    });

    if (allowedEventMappings.length === 0) {
      console.warn(
        `No event templates configured for mission ${session.mission.id}`
      );
      return null;
    }

    // Filter by difficulty and environment
    const validMappings = allowedEventMappings.filter((mapping) => {
      const template = mapping.eventTemplate;
      if (template.difficulty > session.mission.difficulty) return false;

      const config = template.config as any;
      if (
        config.environments &&
        !config.environments.includes(session.mission.environmentType)
      ) {
        return false;
      }

      return true;
    });

    if (validMappings.length === 0) {
      console.warn(
        `No valid event templates for mission ${session.mission.id} at difficulty ${session.mission.difficulty}`
      );
      return null;
    }

    // Weighted random selection
    const totalWeight = validMappings.reduce((sum, m) => sum + m.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedMapping = validMappings[0];
    for (const mapping of validMappings) {
      random -= mapping.weight;
      if (random <= 0) {
        selectedMapping = mapping;
        break;
      }
    }

    const template = selectedMapping.eventTemplate;

    // Generate fresh event data
    const eventData = this.generateEventData(
      template,
      session.mission.difficulty,
      session.mission
    );

    // Create the event with PENDING status initially
    const event = await db.dungeonEvent.create({
      data: {
        sessionId: sessionId,
        templateId: template.id,
        eventNumber: session.events.length + 1,
        status: "PENDING",
        eventData: eventData,
        startsAt: null, // Will be set when activated
      },
    });

    console.log(`🎲 Created pending event:`, {
      id: event.id,
      eventNumber: event.eventNumber,
      status: event.status,
      hasPlayerActions: false, // Fresh events should have no player actions
    });

    // Immediately activate the event since we're spawning it now
    await this.activatePendingEvent(sessionId, event.id);

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

    // Resume timer after event completion
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
        pausedAt: null, // Resume timer
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
   * Generate event-specific data based on template and difficulty
   */
  private static generateEventData(
    template: any,
    difficulty: number,
    mission: any
  ): any {
    const baseData = {
      difficulty: difficulty,
      timestamp: new Date().toISOString(),
    };

    switch (template.type) {
      case EventType.COMBAT:
        return {
          ...baseData,
          enemyCount: Math.min(
            mission.maxMonstersPerEncounter || 4,
            Math.floor(difficulty / 2) + 1
          ),
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

  /**
   * Spawn a boss event (for CLEAR missions when timer expires)
   */
  static async spawnBossEvent(
    sessionId: string,
    bossTemplateId: string
  ): Promise<string> {
    const template = await db.eventTemplate.findUnique({
      where: { id: bossTemplateId },
    });

    if (!template) throw new Error("Boss template not found");

    console.log(`🎯 Spawning boss event with template:`, {
      id: template.id,
      type: template.type,
      name: template.name,
    });

    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true },
    });

    if (!session) throw new Error("Session not found");

    // Pause timer during boss fight
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: {
        pausedAt: new Date(),
      },
    });

    // Create boss event
    const eventData = this.generateEventData(
      template,
      session.mission.difficulty,
      session.mission
    );

    // Generate monsters for boss event immediately
    const monsters = await this.generateMonstersForEvent(template);

    // Add initial combat state with generated monsters
    const combatState = {
      monsters: monsters,
      turnCount: 0,
      playerDamageDealt: 0,
      enemyDamageDealt: {}, // Should be Record<string, number>, not a number
      monstersDefeated: 0,
      partyHealthUpdates: {},
    };

    const event = await db.dungeonEvent.create({
      data: {
        sessionId: sessionId,
        templateId: template.id,
        eventNumber:
          (await db.dungeonEvent.count({ where: { sessionId } })) + 1,
        status: "ACTIVE",
        eventData: {
          ...eventData,
          combatState: combatState,
        },
        startsAt: new Date(),
      },
    });

    await db.dungeonSession.update({
      where: { id: sessionId },
      data: { currentEventId: event.id },
    });

    console.log(`🎯 Boss event created:`, {
      eventId: event.id,
      templateType: template.type,
      status: event.status,
    });

    return event.id;
  }

  /**
   * Generate monsters for an event template
   */
  private static async generateMonstersForEvent(template: any): Promise<any[]> {
    const config = template.config || {};

    // Fetch monster templates
    const templates = await db.monsterTemplate.findMany({
      where: {
        id: {
          in: config.monsterTemplateIds || [],
        },
      },
    });

    if (templates.length === 0) {
      console.log("⚠️ No monster templates found for event");
      return [];
    }

    // Determine number of monsters to generate
    const minMonsters = config.minMonsters || 1;
    const maxMonsters = config.maxMonsters || 1;
    const monsterCount =
      Math.floor(Math.random() * (maxMonsters - minMonsters + 1)) + minMonsters;

    const monsters = [];
    for (let i = 0; i < monsterCount; i++) {
      // Pick random template
      const templateIndex = Math.floor(Math.random() * templates.length);
      const monsterTemplate = templates[templateIndex];

      // Determine rarity
      const eliteChance = config.eliteChance || 0.2;
      const specialAbilityChance = config.specialAbilityChance || 0.3;

      let rarity = "COMMON";
      if (Math.random() < eliteChance) {
        rarity = "ELITE";
      } else if (Math.random() < specialAbilityChance) {
        rarity = "RARE";
      }

      // Generate monster instance
      const monster = {
        id: `monster-${i}-${Date.now()}`,
        templateId: monsterTemplate.id,
        name: monsterTemplate.name,
        type: monsterTemplate.type,
        rarity: rarity,
        health: monsterTemplate.baseHealth,
        maxHealth: monsterTemplate.baseHealth,
        attack: monsterTemplate.baseAttack,
        defense: monsterTemplate.baseDefense,
        attackInterval: monsterTemplate.attackSpeed,
        nextAttackTime:
          Date.now() +
          monsterTemplate.attackSpeed * 1000 +
          Math.random() * 2000, // Add 0-2 seconds random offset
        abilities: monsterTemplate.abilities,
        description: monsterTemplate.description,
      };

      monsters.push(monster);
    }

    console.log(
      `🎯 Generated ${monsters.length} monsters for boss event:`,
      monsters.map((m) => ({
        name: m.name,
        health: m.health,
        rarity: m.rarity,
      }))
    );
    return monsters;
  }
}
