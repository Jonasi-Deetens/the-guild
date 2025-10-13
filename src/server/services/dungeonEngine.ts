import { db } from "@/lib/db";
import { EventSpawner } from "./eventSpawner";
import { RewardService } from "./rewardService";
import { MissionScheduler } from "./missionScheduler";
import { EventType, EventStatus } from "@prisma/client";

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
   * Submit an action for an active event
   */
  async submitEventAction(
    sessionId: string,
    characterId: string,
    action: string,
    actionData: any = {}
  ): Promise<DungeonResult> {
    const session: any = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        mission: true,
      },
    });

    if (!session || session.status !== "ACTIVE") {
      throw new Error(`Session ${sessionId} is not active`);
    }

    if (!session.currentEventId) {
      throw new Error(`No active event in session ${sessionId}`);
    }

    const event: any = await db.dungeonEvent.findUnique({
      where: { id: session.currentEventId },
      include: { template: true },
    });
    if (!event || event.status !== "ACTIVE") {
      throw new Error(`Event ${session.currentEventId} is not active`);
    }

    // Check if character already submitted an action for this event
    const existingAction = await db.dungeonPlayerAction.findUnique({
      where: {
        eventId_characterId: {
          eventId: event.id,
          characterId: characterId,
        },
      },
    });

    let playerAction;
    if (existingAction) {
      // Update existing action (for minigame completions, etc.)
      playerAction = await db.dungeonPlayerAction.update({
        where: {
          eventId_characterId: {
            eventId: event.id,
            characterId: characterId,
          },
        },
        data: {
          actionType: action,
          actionData: actionData,
        },
      });
    } else {
      // Create new action record
      playerAction = await db.dungeonPlayerAction.create({
        data: {
          eventId: event.id,
          characterId: characterId,
          actionType: action,
          actionData: actionData,
        },
      });
    }

    // Process the action based on event type
    const result = await this.processEventAction(
      event,
      characterId,
      action,
      actionData
    );

    // Update the action with the result
    await db.dungeonPlayerAction.update({
      where: { id: playerAction.id },
      data: { result: result },
    });

    // Update event data with any state changes (like combat state)
    if (result.combatState) {
      await db.dungeonEvent.update({
        where: { id: event.id },
        data: {
          eventData: {
            ...event.eventData,
            combatState: result.combatState,
          },
        },
      });
    }

    // Check if event should be completed based on event type and actions
    // Pass the updated event data with combat state if available
    const updatedEvent = result.combatState
      ? {
          ...event,
          eventData: {
            ...event.eventData,
            combatState: result.combatState,
          },
        }
      : event;

    const shouldComplete = await this.shouldCompleteEvent(updatedEvent, result);

    if (shouldComplete) {
      // Event is complete, resolve it
      await this.resolveEvent(sessionId, event.id);
    }

    return result;
  }

  /**
   * Check if an event should be completed based on its type and current state
   */
  private async shouldCompleteEvent(
    event: any,
    lastResult: any
  ): Promise<boolean> {
    const eventType = event.template?.type as EventType;
    const eventData = event.eventData as any;

    switch (eventType) {
      case EventType.COMBAT:
        // Combat events should complete when all enemies are defeated or all players are dead
        return await this.isCombatComplete(event, lastResult);

      case EventType.TREASURE:
        // Treasure events complete after any action (success, failure, or minigame completion)
        return true;

      case EventType.TRAP:
        // Trap events complete after any action (success, failure, or minigame completion)
        return true;

      case EventType.PUZZLE:
        // Puzzle events complete after any action (success, failure, or minigame completion)
        return true;

      case EventType.CHOICE:
        // Choice events complete after one choice is made
        return true;

      case EventType.REST:
        // Rest events complete after one action
        return true;

      case EventType.BOSS:
        // Boss events should complete when boss is defeated or all players are dead
        return await this.isCombatComplete(event, lastResult);

      case EventType.NPC_ENCOUNTER:
        // NPC encounters complete after one interaction
        return true;

      case EventType.ENVIRONMENTAL_HAZARD:
        // Environmental hazards complete after one action
        return true;

      default:
        // Default: complete after one action
        return true;
    }
  }

  /**
   * Check if combat is complete (all enemies defeated or all players dead)
   */
  private async isCombatComplete(
    event: any,
    lastResult: any
  ): Promise<boolean> {
    console.log(`🔍 isCombatComplete - lastResult:`, lastResult);

    // If the last result indicates victory or defeat, combat is complete
    if (lastResult?.victory === true || lastResult?.defeat === true) {
      console.log(`✅ Combat complete - victory/defeat detected`);
      return true;
    }

    // Check if player fled
    if (lastResult?.fled === true) {
      console.log(`✅ Combat complete - player fled`);
      return true;
    }

    // Check combat state for victory/defeat conditions
    const eventData = event.eventData as any;
    const combatState = eventData.combatState;

    console.log(`🔍 Combat state:`, combatState);

    if (combatState) {
      // Victory: all enemies defeated
      if (combatState.enemies) {
        const aliveEnemies = combatState.enemies.filter(
          (enemy: any) => enemy.health > 0
        );
        if (aliveEnemies.length === 0) {
          console.log(
            `✅ Combat complete - all enemies defeated (${combatState.enemies.length} enemies)`
          );
          return true;
        }
      } else if (combatState.enemyHealth <= 0) {
        // Legacy support for old combat state format
        console.log(
          `✅ Combat complete - enemies defeated (legacy health: ${combatState.enemyHealth})`
        );
        return true;
      }

      // Defeat: player took too much damage (simplified check)
      if (combatState.enemyDamageDealt >= 100) {
        console.log(
          `✅ Combat complete - player defeated (damage: ${combatState.enemyDamageDealt})`
        );
        return true;
      }
    }

    // Combat continues if no victory/defeat conditions are met
    console.log(`⏳ Combat continues - no victory/defeat conditions met`);
    return false;
  }

  /**
   * Process an event action based on event type
   */
  private async processEventAction(
    event: any,
    characterId: string,
    action: string,
    actionData: any
  ): Promise<any> {
    const character = await db.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    const eventType = event.template?.type as EventType;
    const eventData = event.eventData as any;

    switch (eventType) {
      case EventType.COMBAT:
        return await this.processCombatAction(
          event,
          character,
          action,
          actionData
        );

      case EventType.TREASURE:
        return await this.processTreasureAction(
          event,
          character,
          action,
          actionData
        );

      case EventType.TRAP:
        return await this.processTrapAction(
          event,
          character,
          action,
          actionData
        );

      case EventType.PUZZLE:
        return await this.processPuzzleAction(
          event,
          character,
          action,
          actionData
        );

      case EventType.CHOICE:
        return await this.processChoiceAction(
          event,
          character,
          action,
          actionData
        );

      case EventType.REST:
        return await this.processRestAction(
          event,
          character,
          action,
          actionData
        );

      case EventType.BOSS:
        return await this.processBossAction(
          event,
          character,
          action,
          actionData
        );

      case EventType.ENVIRONMENTAL_HAZARD:
        return await this.processEnvironmentalHazardAction(
          event,
          character,
          action,
          actionData
        );

      case EventType.NPC_ENCOUNTER:
        return await this.processNpcEncounterAction(
          event,
          character,
          action,
          actionData
        );

      case EventType.BETRAYAL_OPPORTUNITY:
        return await this.processBetrayalAction(
          event,
          character,
          action,
          actionData
        );

      default:
        return {
          success: false,
          message: "Unknown event type",
        };
    }
  }

  /**
   * Process combat action
   */
  private async processCombatAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    const eventData = event.eventData as any;

    // Get or initialize combat state
    let combatState = eventData.combatState || {
      enemies: Array.from({ length: eventData.enemyCount || 1 }, (_, i) => ({
        id: i,
        health: 100,
        maxHealth: 100,
      })),
      turnCount: 0,
      playerDamageDealt: 0,
      enemyDamageDealt: 0,
    };

    // Increment turn count
    combatState.turnCount++;

    const damage = this.calculateDamage(character, eventData.enemyLevel || 1);

    if (action === "attack" || action === "MINIGAME_COMPLETE") {
      let finalDamage = 0;
      let isCritical = false;
      let message = "";

      if (action === "MINIGAME_COMPLETE" && actionData) {
        // Process minigame result
        const minigameResult = actionData.minigameResult || actionData;

        if (minigameResult.victory) {
          // Minigame completed with victory - return victory result immediately
          return {
            success: true,
            message: "Victory! All enemies defeated!",
            damage: minigameResult.damageDealt || 0,
            isCritical: false,
            victory: true,
            combatState: combatState,
          };
        } else {
          // Minigame failed - player was defeated

          // Apply damage to character (if any)
          if (minigameResult.damageTaken) {
            await RewardService.applyEventRewards(
              event.sessionId,
              event.id,
              character.id,
              {
                healthChange: -minigameResult.damageTaken,
              }
            );
          }

          return {
            success: false,
            message: "Defeat! You have been defeated in combat!",
            damage: 0,
            isCritical: false,
            defeat: true,
            combatState: combatState,
          };
        }
      } else {
        // Direct attack action
        isCritical = Math.random() < character.criticalChance;
        finalDamage = isCritical ? damage * 2 : damage;
        message = isCritical
          ? `Critical hit! Dealt ${finalDamage} damage!`
          : `Dealt ${finalDamage} damage!`;
      }

      // Find the first alive enemy to attack
      const targetEnemy = combatState.enemies.find(
        (enemy: any) => enemy.health > 0
      );

      if (targetEnemy) {
        targetEnemy.health -= finalDamage;
        combatState.playerDamageDealt += finalDamage;

        console.log(
          `🔍 Combat action - after damage: enemy ${targetEnemy.id} health=${targetEnemy.health}, finalDamage=${finalDamage}`
        );

        // Check if all enemies are defeated
        const aliveEnemies = combatState.enemies.filter(
          (enemy: any) => enemy.health > 0
        );
        if (aliveEnemies.length === 0) {
          console.log(`✅ Combat action - VICTORY! All enemies defeated`);
          return {
            success: true,
            message: message + " Victory!",
            damage: finalDamage,
            isCritical: isCritical,
            victory: true,
            combatState: combatState,
          };
        }
      } else {
        // No alive enemies found (shouldn't happen)
        console.log(`⚠️ Combat action - No alive enemies found`);
        return {
          success: true,
          message: "No enemies to attack!",
          damage: 0,
          isCritical: false,
          combatState: combatState,
        };
      }

      return {
        success: true,
        message: message,
        damage: finalDamage,
        isCritical: isCritical,
        combatState: combatState,
      };
    } else if (action === "block") {
      // Character blocks - reduce incoming damage
      const enemyDamage = Math.floor(damage * 0.3); // Block reduces damage by 70%
      combatState.enemyDamageDealt += enemyDamage;

      return {
        success: true,
        message: `Blocked the attack! Took ${enemyDamage} damage.`,
        blocked: true,
        damage: enemyDamage,
        combatState: combatState,
      };
    } else if (action === "flee") {
      // Character flees
      const fleeChance = 0.7; // 70% chance to flee
      const success = Math.random() < fleeChance;

      return {
        success: success,
        message: success ? "Successfully fled from combat!" : "Failed to flee!",
        fled: success,
        combatState: combatState,
      };
    }

    return {
      success: false,
      message: "Invalid combat action",
      combatState: combatState,
    };
  }

  /**
   * Process treasure action
   */
  private async processTreasureAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    const eventData = event.eventData as any;

    if (action === "take" || action === "MINIGAME_COMPLETE") {
      // Handle both direct take action and minigame completion
      let gold = 0;
      let experience = 0;
      let success = true;
      let message = "";

      if (action === "MINIGAME_COMPLETE" && actionData) {
        // Process minigame result
        const minigameResult = actionData.minigameResult || actionData;

        if (minigameResult.success || minigameResult.victory) {
          // Minigame succeeded - get full rewards
          gold = eventData.goldAmount || 50;
          experience = Math.floor(gold / 10);
          message = `Successfully unlocked the cache! Found ${gold} gold!`;
        } else if (minigameResult.trapped) {
          // Minigame triggered trap - reduced rewards and damage
          gold = Math.floor((eventData.goldAmount || 50) * 0.5);
          experience = Math.floor(gold / 10);
          message = `The cache was trapped! Found ${gold} gold but took damage.`;
        } else {
          // Minigame failed - no rewards
          gold = 0;
          experience = 5;
          message = "Failed to unlock the cache. No rewards gained.";
        }
      } else {
        // Direct take action
        gold = eventData.goldAmount || 50;
        experience = Math.floor(gold / 10);
        message = `Found ${gold} gold!`;
      }

      // Apply rewards immediately
      await RewardService.applyEventRewards(
        event.sessionId,
        event.id,
        character.id,
        {
          gold: gold,
          experience: experience,
        }
      );

      return {
        success: success,
        message: message,
        rewards: {
          gold: gold,
          experience: experience,
        },
      };
    }

    return {
      success: false,
      message: "Invalid treasure action",
    };
  }

  /**
   * Process trap action
   */
  private async processTrapAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    const eventData = event.eventData as any;

    if (action === "disarm" || action === "MINIGAME_COMPLETE") {
      let success = false;
      let message = "";
      let experience = 0;
      let gold = 0;
      let damage = 0;

      if (action === "MINIGAME_COMPLETE" && actionData) {
        // Process minigame result
        const minigameResult = actionData.minigameResult || actionData;
        success = minigameResult.success || minigameResult.victory || false;

        if (success) {
          experience = 15;
          gold = 5;
          message = "Successfully disarmed the trap!";
        } else {
          damage = eventData.damage || 10;
          message = `Failed to disarm trap! Took ${damage} damage!`;
        }
      } else {
        // Direct disarm action
        const disarmChance = eventData.disarmChance || 0.5;
        success = Math.random() < disarmChance;

        if (success) {
          experience = 15;
          gold = 5;
          message = "Successfully disarmed the trap!";
        } else {
          damage = eventData.damage || 10;
          message = `Failed to disarm trap! Took ${damage} damage!`;
        }
      }

      if (success) {
        await RewardService.applyEventRewards(
          event.sessionId,
          event.id,
          character.id,
          {
            experience: experience,
            gold: gold,
          }
        );

        return {
          success: true,
          message: message,
          rewards: {
            experience: experience,
            gold: gold,
          },
        };
      } else {
        await RewardService.applyEventRewards(
          event.sessionId,
          event.id,
          character.id,
          {
            healthChange: -damage,
          }
        );

        return {
          success: false,
          message: message,
          damage: damage,
        };
      }
    }

    return {
      success: false,
      message: "Invalid trap action",
    };
  }

  /**
   * Process puzzle action
   */
  private async processPuzzleAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    const eventData = event.eventData as any;

    if (action === "solve" || action === "MINIGAME_COMPLETE") {
      let success = false;
      let message = "";
      let experience = 0;
      let gold = 0;
      let damage = 0;

      if (action === "MINIGAME_COMPLETE" && actionData) {
        // Process minigame result
        const minigameResult = actionData.minigameResult || actionData;
        success = minigameResult.success || minigameResult.victory || false;

        if (success) {
          experience = 20;
          gold = 10;
          message = "Puzzle solved correctly!";
        } else {
          damage = 5;
          message = "Wrong answer! Took 5 damage!";
        }
      } else {
        // Direct solve action
        const solution = actionData.solution;
        const correctSolution = eventData.solution || "123";
        success = solution === correctSolution;

        if (success) {
          experience = 20;
          gold = 10;
          message = "Puzzle solved correctly!";
        } else {
          damage = 5;
          message = "Wrong answer! Took 5 damage!";
        }
      }

      if (success) {
        await RewardService.applyEventRewards(
          event.sessionId,
          event.id,
          character.id,
          {
            experience: experience,
            gold: gold,
          }
        );

        return {
          success: true,
          message: message,
          rewards: {
            experience: experience,
            gold: gold,
          },
        };
      } else {
        await RewardService.applyEventRewards(
          event.sessionId,
          event.id,
          character.id,
          {
            healthChange: -damage,
          }
        );

        return {
          success: false,
          message: message,
          damage: damage,
        };
      }
    }

    return {
      success: false,
      message: "Invalid puzzle action",
    };
  }

  /**
   * Process choice action
   */
  private async processChoiceAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    const choice = actionData.choice;

    const experience = 5;
    let gold = 0;
    let message = "";

    if (choice === "good") {
      gold = 10;
      message = "You chose the righteous path.";
    } else if (choice === "evil") {
      gold = 20;
      message = "You chose the dark path.";
    } else {
      message = "You chose the neutral path.";
    }

    await RewardService.applyEventRewards(
      event.sessionId,
      event.id,
      character.id,
      {
        experience: experience,
        gold: gold,
      }
    );

    return {
      success: true,
      message: message,
      rewards: {
        experience: experience,
        gold: gold,
      },
    };
  }

  /**
   * Process rest action
   */
  private async processRestAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    const eventData = event.eventData as any;
    const healingAmount = eventData.healingAmount || 20;
    const experience = 5;

    await RewardService.applyEventRewards(
      event.sessionId,
      event.id,
      character.id,
      {
        healthChange: healingAmount,
        experience: experience,
      }
    );

    return {
      success: true,
      message: `Restored ${healingAmount} health!`,
      rewards: {
        healthChange: healingAmount,
        experience: experience,
      },
    };
  }

  /**
   * Process boss action
   */
  private async processBossAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    console.log(`🎯 Processing boss action:`, {
      eventId: event.id,
      action: action,
      hasActionData: !!actionData,
    });

    // Boss actions are handled the same as combat actions
    // This ensures minigame completion works properly
    const result = await this.processCombatAction(
      event,
      character,
      action,
      actionData
    );

    console.log(`🎯 Boss action result:`, {
      success: result.success,
      victory: result.victory,
      defeat: result.defeat,
    });

    return result;
  }

  /**
   * Process environmental hazard action
   */
  private async processEnvironmentalHazardAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    const eventData = event.eventData as any;

    if (action === "avoid") {
      const avoidChance = 0.6; // 60% chance to avoid
      const success = Math.random() < avoidChance;

      if (success) {
        const experience = 10;

        await RewardService.applyEventRewards(
          event.sessionId,
          event.id,
          character.id,
          {
            experience: experience,
          }
        );

        return {
          success: true,
          message: "Successfully avoided the hazard!",
          rewards: {
            experience: experience,
          },
        };
      } else {
        const damage = eventData.damage || 15;

        await RewardService.applyEventRewards(
          event.sessionId,
          event.id,
          character.id,
          {
            healthChange: -damage,
          }
        );

        return {
          success: false,
          message: `Failed to avoid hazard! Took ${damage} damage!`,
          damage: damage,
        };
      }
    }

    return {
      success: false,
      message: "Invalid hazard action",
    };
  }

  /**
   * Process NPC encounter action
   */
  private async processNpcEncounterAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    const experience = 8;
    const gold = 5;

    await RewardService.applyEventRewards(
      event.sessionId,
      event.id,
      character.id,
      {
        experience: experience,
        gold: gold,
      }
    );

    return {
      success: true,
      message: "Had a pleasant conversation with the NPC.",
      rewards: {
        experience: experience,
        gold: gold,
      },
    };
  }

  /**
   * Process betrayal action
   */
  private async processBetrayalAction(
    event: any,
    character: any,
    action: string,
    actionData: any
  ): Promise<any> {
    const betrayed = actionData.betray;

    if (betrayed) {
      const gold = 50;

      await RewardService.applyEventRewards(
        event.sessionId,
        event.id,
        character.id,
        {
          gold: gold,
        }
      );

      return {
        success: true,
        message: "You betrayed your party for gold!",
        rewards: {
          gold: gold,
        },
      };
    } else {
      const experience = 15;

      await RewardService.applyEventRewards(
        event.sessionId,
        event.id,
        character.id,
        {
          experience: experience,
        }
      );

      return {
        success: true,
        message: "You remained loyal to your party.",
        rewards: {
          experience: experience,
        },
      };
    }
  }

  /**
   * Resolve an event after all actions are submitted
   */
  private async resolveEvent(
    sessionId: string,
    eventId: string
  ): Promise<void> {
    console.log(`🔍 Resolving event ${eventId} for session ${sessionId}`);

    const event = await db.dungeonEvent.findUnique({
      where: { id: eventId },
      include: { template: true, playerActions: true },
    });

    if (!event) {
      console.log(`❌ Event ${eventId} not found`);
      return;
    }

    console.log(`🔍 Event found:`, {
      id: event.id,
      type: event.template?.type,
      status: event.status,
      playerActionsCount: event.playerActions.length,
    });

    // Calculate final results based on all actions
    const results = await this.calculateEventResults(event);

    // Update event with results
    await db.dungeonEvent.update({
      where: { id: eventId },
      data: {
        status: "COMPLETED",
        results: results,
        completedAt: new Date(),
      },
    });

    // Complete the event in the spawner
    await EventSpawner.completeEvent(sessionId, eventId);

    // Check if this was a boss victory that should complete the mission
    console.log(`🔍 Checking boss victory:`, {
      eventType: event.template?.type,
      hasVictory: results?.victory === true,
      results: results,
    });

    if (event.template?.type === "BOSS" && results?.victory === true) {
      console.log(`🎉 Boss defeated! Completing mission...`);

      // Get the session to complete the mission
      const session = await db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: { mission: true },
      });

      if (session) {
        // Import MissionScheduler to complete the mission
        const { MissionScheduler } = await import("./missionScheduler");
        await MissionScheduler.handleMissionSuccess(session, "Boss defeated!");
        return; // Don't continue with normal event completion
      }
    }

    // Check if this was a combat or boss defeat that should fail the mission
    if (
      (event.template?.type === "COMBAT" || event.template?.type === "BOSS") &&
      results?.defeat === true
    ) {
      console.log(
        `💀 Combat defeat detected, checking if mission should fail...`
      );

      // Get the session to check if it's a solo mission
      const session = await db.dungeonSession.findUnique({
        where: { id: sessionId },
        include: { party: true },
      });

      if (session && !session.party) {
        // This is a solo mission - check if the character is dead
        // Find character by looking at player actions in this event
        const playerAction = await db.dungeonPlayerAction.findFirst({
          where: { eventId: eventId },
          include: { character: true },
        });

        const character = playerAction?.character;

        if (character && character.currentHealth <= 0) {
          console.log(`💀 Solo mission character is dead, failing mission...`);
          // Import MissionScheduler to fail the mission
          const { MissionScheduler } = await import("./missionScheduler");
          await MissionScheduler.handleMissionFailure(
            session,
            "Character died in combat"
          );
          return; // Don't continue with normal event completion
        }
      }
    }

    // Send WebSocket event to notify frontend
    try {
      const { wsManager } = await import("@/server/websocket");
      if (wsManager) {
        // Emit to all connected players for now (we can refine this later)
        wsManager.emitToHub("eventCompleted", {
          eventId: eventId,
          sessionId: sessionId,
          results: results,
        });
        console.log(
          `📡 Sent WebSocket eventCompleted for event ${eventId} to session ${sessionId}`
        );
      } else {
        console.log(`⚠️ WebSocket manager not available`);
      }
    } catch (error) {
      console.error(`❌ Failed to send WebSocket event:`, error);
    }

    console.log(`✅ Resolved event ${eventId} for session ${sessionId}`);
  }

  /**
   * Calculate final results for an event
   */
  private async calculateEventResults(event: any): Promise<any> {
    const actions = event.playerActions;
    const eventType = event.template?.type as EventType;

    console.log(`🔍 Calculating event results for ${eventType} event:`, {
      eventId: event.id,
      actionsCount: actions.length,
      actions: actions.map((a) => ({
        actionType: a.actionType,
        result: a.result,
        characterId: a.characterId,
      })),
    });

    // Aggregate results from all player actions
    const results = {
      eventType: eventType,
      totalActions: actions.length,
      timestamp: new Date().toISOString(),
    };

    // For combat/boss events, check if any action resulted in victory or defeat
    if (eventType === "COMBAT" || eventType === "BOSS") {
      const lastAction = actions[actions.length - 1];
      if (lastAction?.result) {
        results.victory = lastAction.result.victory === true;
        results.defeat = lastAction.result.defeat === true;
        results.success = lastAction.result.success === true;

        console.log(`🔍 Combat/Boss event results:`, {
          victory: results.victory,
          defeat: results.defeat,
          success: results.success,
        });
      }
    }

    return results;
  }

  /**
   * Get party members for a session
   */
  private async getPartyMembers(sessionId: string): Promise<any[]> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
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

    if (session?.party) {
      return session.party.members.map((member: any) => member.character);
    }

    // Solo mission - get the character directly
    // This would need to be tracked differently in a real implementation
    // For now, we'll return an empty array for solo missions
    const character = null;

    return character ? [character] : [];
  }

  /**
   * Calculate damage based on character stats and target level
   */
  private calculateDamage(character: any, targetLevel: number): number {
    const baseDamage = character.attack;
    const levelDifference = character.level - targetLevel;
    const levelMultiplier = 1 + levelDifference * 0.1;

    return Math.max(1, Math.floor(baseDamage * levelMultiplier));
  }

  /**
   * Get current mission status
   */
  async getMissionStatus(sessionId: string): Promise<any> {
    return await MissionScheduler.getMissionStatus(sessionId);
  }

  /**
   * Get current event for a session
   */
  async getCurrentEvent(sessionId: string): Promise<any> {
    const session: any = await db.dungeonSession.findUnique({
      where: { id: sessionId },
    });

    console.log(`🔍 getCurrentEvent - session:`, {
      id: sessionId,
      currentEventId: session?.currentEventId,
      status: session?.status,
    });

    if (!session || !session.currentEventId) {
      console.log(`🔍 getCurrentEvent - no current event`);
      return null;
    }

    const event: any = await db.dungeonEvent.findUnique({
      where: { id: session.currentEventId },
      include: {
        template: true,
        playerActions: {
          include: {
            character: true,
          },
        },
      },
    });

    console.log(`🔍 getCurrentEvent - retrieved event:`, {
      id: event?.id,
      status: event?.status,
      eventNumber: event?.eventNumber,
      hasCombatState: !!event?.eventData?.combatState,
      playerActionsCount: event?.playerActions?.length || 0,
      playerActions:
        event?.playerActions?.map((action: any) => ({
          eventId: action.eventId,
          characterId: action.characterId,
          characterName: action.character?.name || "NO_NAME",
          actionType: action.actionType,
          submittedAt: action.submittedAt,
        })) || [],
    });

    return event;
  }
}
