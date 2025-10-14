import { db } from "@/lib/db";
import seedrandom from "seedrandom";

export type EventType =
  | "COMBAT"
  | "TREASURE"
  | "TRAP"
  | "PUZZLE"
  | "CHOICE"
  | "REST"
  | "BETRAYAL_OPPORTUNITY"
  | "NPC_ENCOUNTER"
  | "ENVIRONMENTAL_HAZARD";

export interface TimelineNode {
  id: string;
  type: EventType;
  position: { x: number; y: number };
  data: any;
}

export interface TimelineGraph {
  nodes: TimelineNode[];
  startNodeId: string;
}

export class EventGenerator {
  private rng: () => number;

  constructor(seed: string) {
    this.rng = seedrandom(seed);
  }

  async generateTimeline(
    sessionId: string,
    missionId: string,
    difficulty: number
  ): Promise<TimelineGraph> {
    const mission = await db.mission.findUnique({ where: { id: missionId } });

    if (!mission) {
      throw new Error("Mission not found");
    }

    // Generate main path (5-10 events based on difficulty)
    const mainPathLength = 5 + Math.floor(this.rng() * (difficulty + 1));
    const timeline: TimelineNode[] = [];

    let currentNode: TimelineNode | null = null;

    for (let i = 0; i < mainPathLength; i++) {
      const eventType = this.selectEventType(i, mainPathLength, difficulty);
      const node = await this.createEventNode(
        sessionId,
        i,
        eventType,
        difficulty,
        null // Main path events should not have parentEventId
      );

      timeline.push(node);

      // 30% chance for branching paths (not on first or last event)
      if (i > 0 && i < mainPathLength - 1 && this.rng() < 0.3) {
        const branchNode = await this.createBranchNode(
          sessionId,
          i,
          difficulty,
          node.id
        );
        timeline.push(branchNode);
      }

      currentNode = node;
    }

    return { nodes: timeline, startNodeId: timeline[0].id };
  }

  private selectEventType(
    index: number,
    totalEvents: number,
    difficulty: number
  ): EventType {
    // First event: always combat (introduction)
    if (index === 0) return "COMBAT";

    // Last event: always boss (now handled as COMBAT with isBossFight flag)
    if (index === totalEvents - 1) return "COMBAT";

    // Middle events: weighted random
    const roll = this.rng();
    if (roll < 0.35) return "COMBAT";
    if (roll < 0.55) return "TREASURE";
    if (roll < 0.7) return "TRAP";
    if (roll < 0.8) return "CHOICE";
    if (roll < 0.9) return "PUZZLE";
    return "NPC_ENCOUNTER";
  }

  private async createEventNode(
    sessionId: string,
    eventNumber: number,
    type: EventType,
    difficulty: number,
    parentId?: string
  ): Promise<TimelineNode> {
    // Select matching template
    const templates = await db.eventTemplate.findMany({
      where: { type, difficulty: { lte: difficulty + 1 } },
    });

    const template = templates[Math.floor(this.rng() * templates.length)];

    // Generate procedural event data
    const eventData = this.generateEventData(type, difficulty, template);

    const event = await db.dungeonEvent.create({
      data: {
        sessionId,
        templateId: template?.id,
        eventNumber,
        parentEventId: parentId,
        status: eventNumber === 0 ? "ACTIVE" : "PENDING",
        eventData,
      },
    });

    return {
      id: event.id,
      type,
      position: { x: eventNumber * 200, y: 0 },
      data: eventData,
    };
  }

  private async createBranchNode(
    sessionId: string,
    eventNumber: number,
    difficulty: number,
    parentId: string
  ): Promise<TimelineNode> {
    // Branch events are typically different types
    const branchTypes: EventType[] = [
      "TREASURE",
      "TRAP",
      "CHOICE",
      "NPC_ENCOUNTER",
    ];
    const branchType = branchTypes[Math.floor(this.rng() * branchTypes.length)];

    const templates = await db.eventTemplate.findMany({
      where: { type: branchType, difficulty: { lte: difficulty + 1 } },
    });

    const template = templates[Math.floor(this.rng() * templates.length)];
    const eventData = this.generateEventData(branchType, difficulty, template);

    const event = await db.dungeonEvent.create({
      data: {
        sessionId,
        templateId: template?.id,
        eventNumber: eventNumber + 0.5, // Use decimal to distinguish branches
        parentEventId: parentId,
        status: "PENDING",
        eventData,
      },
    });

    return {
      id: event.id,
      type: branchType,
      position: { x: eventNumber * 200 + 100, y: 100 }, // Offset for visual branching
      data: eventData,
    };
  }

  private generateEventData(
    type: EventType,
    difficulty: number,
    template: any
  ): any {
    switch (type) {
      case "COMBAT":
        return this.generateCombatData(difficulty, template);
      case "TREASURE":
        return this.generateTreasureData(difficulty);
      case "TRAP":
        return this.generateTrapData(difficulty);
      case "PUZZLE":
        return this.generatePuzzleData(difficulty);
      case "CHOICE":
        return this.generateChoiceData(difficulty);
      case "COMBAT":
        // This will be handled by the event spawner to determine if it's a boss fight
        return this.generateCombatData(difficulty);
      case "NPC_ENCOUNTER":
        return this.generateNpcData(difficulty);
      case "ENVIRONMENTAL_HAZARD":
        return this.generateHazardData(difficulty);
      default:
        return {};
    }
  }

  private generateCombatData(difficulty: number, template: any) {
    const enemyCount = 1 + Math.floor(this.rng() * difficulty);
    const enemies = [];

    for (let i = 0; i < enemyCount; i++) {
      enemies.push({
        id: `enemy_${i}`,
        type: this.selectEnemyType(difficulty),
        health: 20 + difficulty * 10,
        maxHealth: 20 + difficulty * 10,
        attack: 5 + difficulty * 2,
        defense: 2 + difficulty,
        personality: this.selectPersonality(),
      });
    }

    return {
      enemies,
      environment: template?.config?.environments?.[0] || "dungeon",
      contextualBehavior: true,
      timeLimit: 120, // 2 minutes
    };
  }

  private generateTreasureData(difficulty: number) {
    const treasureCount = 1 + Math.floor(this.rng() * 3);
    const treasures = [];

    for (let i = 0; i < treasureCount; i++) {
      treasures.push({
        id: `treasure_${i}`,
        type: this.selectTreasureType(difficulty),
        value: 50 + difficulty * 25,
        rarity: this.selectRarity(difficulty),
      });
    }

    return {
      treasures,
      trapChance: 0.2 + difficulty * 0.1,
      timeLimit: 60,
    };
  }

  private generateTrapData(difficulty: number) {
    return {
      trapType: this.selectTrapType(difficulty),
      damage: 10 + difficulty * 5,
      detectionDifficulty: difficulty * 2,
      disarmDifficulty: difficulty * 3,
      timeLimit: 90,
    };
  }

  private generatePuzzleData(difficulty: number) {
    return {
      puzzleType: this.selectPuzzleType(difficulty),
      complexity: difficulty,
      hints: Math.max(0, 3 - difficulty),
      timeLimit: 180,
    };
  }

  private generateChoiceData(difficulty: number) {
    return {
      scenario: this.selectChoiceScenario(difficulty),
      options: this.generateChoiceOptions(difficulty),
      consequences: this.generateConsequences(difficulty),
      timeLimit: 120,
    };
  }

  private generateBossData(difficulty: number) {
    return {
      bossType: this.selectBossType(difficulty),
      health: 100 + difficulty * 50,
      maxHealth: 100 + difficulty * 50,
      attack: 15 + difficulty * 5,
      defense: 8 + difficulty * 3,
      phases: 1 + Math.floor(difficulty / 2),
      specialAbilities: this.generateBossAbilities(difficulty),
      timeLimit: 300, // 5 minutes for boss
    };
  }

  private generateNpcData(difficulty: number) {
    return {
      npcType: this.selectNpcType(difficulty),
      disposition: this.selectDisposition(),
      quest: this.generateNpcQuest(difficulty),
      rewards: this.generateNpcRewards(difficulty),
      timeLimit: 90,
    };
  }

  private generateHazardData(difficulty: number) {
    return {
      hazardType: this.selectHazardType(difficulty),
      damage: 5 + difficulty * 3,
      duration: 30 + difficulty * 10,
      avoidanceDifficulty: difficulty * 2,
      timeLimit: 60,
    };
  }

  private selectEnemyType(difficulty: number): string {
    const types = ["goblin", "skeleton", "bandit", "wolf", "demon"];
    return types[Math.min(difficulty - 1, types.length - 1)];
  }

  private selectPersonality(): string {
    const personalities = ["aggressive", "cowardly", "vengeful", "greedy"];
    return personalities[Math.floor(this.rng() * personalities.length)];
  }

  private selectTreasureType(difficulty: number): string {
    const types = ["gold", "gem", "artifact", "weapon", "armor"];
    return types[Math.min(difficulty - 1, types.length - 1)];
  }

  private selectRarity(difficulty: number): string {
    const rarities = ["common", "uncommon", "rare", "epic", "legendary"];
    return rarities[Math.min(difficulty - 1, rarities.length - 1)];
  }

  private selectTrapType(difficulty: number): string {
    const types = ["spike", "poison", "fire", "magic", "mechanical"];
    return types[Math.min(difficulty - 1, types.length - 1)];
  }

  private selectPuzzleType(difficulty: number): string {
    const types = ["riddle", "pattern", "sequence", "logic", "memory"];
    return types[Math.min(difficulty - 1, types.length - 1)];
  }

  private selectChoiceScenario(difficulty: number): string {
    const scenarios = [
      "injured_traveler",
      "cursed_chest",
      "forked_path",
      "moral_dilemma",
      "resource_shortage",
    ];
    return scenarios[Math.floor(this.rng() * scenarios.length)];
  }

  private generateChoiceOptions(difficulty: number): any[] {
    return [
      { id: "option_1", text: "Help them", consequence: "positive" },
      { id: "option_2", text: "Ignore them", consequence: "neutral" },
      { id: "option_3", text: "Take advantage", consequence: "negative" },
    ];
  }

  private generateConsequences(difficulty: number): any {
    return {
      positive: { reputation: 5, gold: 10 },
      neutral: { reputation: 0, gold: 0 },
      negative: { reputation: -5, gold: 20 },
    };
  }

  private selectBossType(difficulty: number): string {
    const types = [
      "goblin_chief",
      "skeleton_lord",
      "bandit_king",
      "demon_prince",
      "dragon",
    ];
    return types[Math.min(difficulty - 1, types.length - 1)];
  }

  private generateBossAbilities(difficulty: number): string[] {
    const abilities = ["charge", "heal", "summon", "shield", "berserk"];
    return abilities.slice(0, Math.min(difficulty, abilities.length));
  }

  private selectNpcType(difficulty: number): string {
    const types = ["merchant", "wizard", "guard", "noble", "hermit"];
    return types[Math.floor(this.rng() * types.length)];
  }

  private selectDisposition(): string {
    const dispositions = [
      "friendly",
      "neutral",
      "hostile",
      "suspicious",
      "desperate",
    ];
    return dispositions[Math.floor(this.rng() * dispositions.length)];
  }

  private generateNpcQuest(difficulty: number): any {
    return {
      type: "fetch",
      description: "Retrieve a lost item",
      reward: 50 + difficulty * 25,
    };
  }

  private generateNpcRewards(difficulty: number): any {
    return {
      gold: 25 + difficulty * 15,
      experience: 20 + difficulty * 10,
      items: difficulty > 2 ? ["health_potion"] : [],
    };
  }

  private selectHazardType(difficulty: number): string {
    const types = [
      "falling_rocks",
      "poison_gas",
      "fire",
      "flood",
      "magic_storm",
    ];
    return types[Math.min(difficulty - 1, types.length - 1)];
  }
}
