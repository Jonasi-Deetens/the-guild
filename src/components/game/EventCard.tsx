"use client";

import { useState, useEffect } from "react";
import { MinigameContainer, getMinigameTypeForEvent } from "./minigames";

interface EventCardProps {
  event: {
    id: string;
    type: string;
    status: string;
    eventData: any;
    results?: any;
    template?: {
      name: string;
      description: string;
      type: string;
      config: any;
    };
    playerActions: Array<{
      characterId: string;
      actionType: string;
      actionData: any;
      character: {
        name: string;
      };
    }>;
  };
  onActionSubmit: (actionType: string, actionData: any) => void;
  playerStats: {
    speed: number;
    perception: number;
    attack: number;
    defense: number;
  };
  hasSubmitted: boolean;
  partyMembers?: Array<{
    id: string;
    name: string;
    currentHealth: number;
    maxHealth: number;
    attack: number;
    defense: number;
  }>;
}

export function EventCard({
  event,
  onActionSubmit,
  playerStats,
  hasSubmitted,
  partyMembers = [],
}: EventCardProps) {
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [showMinigame, setShowMinigame] = useState<boolean>(false);
  const [minigameResult, setMinigameResult] = useState<any>(null);

  const getEventTypeColor = (type: string, eventData?: any) => {
    // Check if this is a boss fight for special styling
    const isBossFight = eventData?.isBossFight || false;

    switch (type) {
      case "COMBAT":
        return isBossFight
          ? "border-red-600 bg-red-900/30"
          : "border-red-500 bg-red-900/20";
      case "TREASURE":
        return "border-yellow-500 bg-yellow-900/20";
      case "TRAP":
        return "border-orange-500 bg-orange-900/20";
      case "PUZZLE":
        return "border-purple-500 bg-purple-900/20";
      case "CHOICE":
        return "border-blue-500 bg-blue-900/20";
      case "REST":
        return "border-green-500 bg-green-900/20";
      case "NPC_ENCOUNTER":
        return "border-green-500 bg-green-900/20";
      case "ENVIRONMENTAL_HAZARD":
        return "border-gray-500 bg-gray-900/20";
      case "BETRAYAL_OPPORTUNITY":
        return "border-purple-600 bg-purple-900/30";
      default:
        return "border-gray-500 bg-gray-900/20";
    }
  };

  const getEventTypeIcon = (type: string, eventData?: any) => {
    // Check if this is a boss fight for special icon
    const isBossFight = eventData?.isBossFight || false;

    switch (type) {
      case "COMBAT":
        return isBossFight ? "👹" : "⚔️";
      case "TREASURE":
        return "💰";
      case "TRAP":
        return "⚠️";
      case "PUZZLE":
        return "🧩";
      case "CHOICE":
        return "🤔";
      case "REST":
        return "😴";
      case "NPC_ENCOUNTER":
        return "👤";
      case "ENVIRONMENTAL_HAZARD":
        return "🌪️";
      case "BETRAYAL_OPPORTUNITY":
        return "🗡️";
      default:
        return "❓";
    }
  };

  const getAvailableActions = (type: string, eventData?: any) => {
    switch (type) {
      case "COMBAT":
        const combatActions = [
          {
            id: "ATTACK",
            label: "Attack",
            description: "Deal damage to enemies",
            icon: "⚔️",
            risk: "medium",
          },
          {
            id: "DEFEND",
            label: "Defend",
            description: "Reduce incoming damage by 50%",
            icon: "🛡️",
            risk: "low",
          },
          {
            id: "FLEE",
            label: "Flee",
            description: "Attempt to escape (may fail)",
            icon: "🏃",
            risk: "high",
          },
          {
            id: "USE_ITEM",
            label: "Use Item",
            description: "Consume a healing potion or buff",
            icon: "🧪",
            risk: "low",
          },
        ];

        if (eventData?.enemies?.length > 1) {
          combatActions.push({
            id: "AREA_ATTACK",
            label: "Area Attack",
            description: "Attack all enemies (reduced damage)",
            icon: "💥",
            risk: "medium",
          });
        }

        if (
          eventData?.enemies?.some((e: any) => e.personality === "cowardly")
        ) {
          combatActions.push({
            id: "INTIMIDATE",
            label: "Intimidate",
            description: "Scare cowardly enemies",
            icon: "😠",
            risk: "low",
          });
        }

        return combatActions;

      case "TREASURE":
        return [
          {
            id: "COLLECT",
            label: "Collect",
            description: "Gather the treasure quickly",
            icon: "💰",
            risk: "high",
          },
          {
            id: "INSPECT",
            label: "Inspect",
            description: "Check for traps first (slower)",
            icon: "🔍",
            risk: "low",
          },
          {
            id: "LEAVE",
            label: "Leave",
            description: "Ignore the treasure safely",
            icon: "🚶",
            risk: "none",
          },
          {
            id: "MARK",
            label: "Mark Location",
            description: "Remember this spot for later",
            icon: "📍",
            risk: "none",
          },
        ];

      case "TRAP":
        return [
          {
            id: "AVOID",
            label: "Avoid",
            description: "Try to dodge the trap",
            icon: "🤸",
            risk: "medium",
          },
          {
            id: "DISARM",
            label: "Disarm",
            description: "Attempt to disable it safely",
            icon: "🔧",
            risk: "high",
          },
          {
            id: "TRIGGER",
            label: "Trigger Safely",
            description: "Set it off from a distance",
            icon: "🎯",
            risk: "low",
          },
          {
            id: "STUDY",
            label: "Study",
            description: "Learn how it works",
            icon: "📚",
            risk: "none",
          },
        ];

      case "PUZZLE":
        return [
          {
            id: "SOLVE",
            label: "Solve",
            description: "Attempt to solve the puzzle",
            icon: "🧩",
            risk: "medium",
          },
          {
            id: "HINT",
            label: "Ask for Hint",
            description: "Get a clue (uses hint)",
            icon: "💡",
            risk: "low",
          },
          {
            id: "SKIP",
            label: "Skip",
            description: "Give up on the puzzle",
            icon: "❌",
            risk: "none",
          },
          {
            id: "BRUTE_FORCE",
            label: "Brute Force",
            description: "Try all combinations",
            icon: "💪",
            risk: "high",
          },
        ];

      case "CHOICE":
        // Dynamic choices based on event data
        if (eventData?.scenario === "injured_traveler") {
          return [
            {
              id: "HELP",
              label: "Help Them",
              description: "Provide aid (+reputation, -resources)",
              icon: "🤝",
              risk: "low",
            },
            {
              id: "IGNORE",
              label: "Ignore",
              description: "Walk past them",
              icon: "🚶",
              risk: "none",
            },
            {
              id: "ROB",
              label: "Rob Them",
              description: "Take their belongings (-reputation, +gold)",
              icon: "💰",
              risk: "medium",
            },
            {
              id: "QUESTION",
              label: "Question",
              description: "Ask about their situation",
              icon: "❓",
              risk: "none",
            },
          ];
        }

        return [
          {
            id: "HELP",
            label: "Help",
            description: "Choose the helpful option",
            icon: "🤝",
            risk: "low",
          },
          {
            id: "IGNORE",
            label: "Ignore",
            description: "Choose the neutral option",
            icon: "🚶",
            risk: "none",
          },
          {
            id: "HARM",
            label: "Harm",
            description: "Choose the harmful option",
            icon: "⚔️",
            risk: "high",
          },
          {
            id: "NEGOTIATE",
            label: "Negotiate",
            description: "Try to find a compromise",
            icon: "🤝",
            risk: "medium",
          },
        ];

      // BOSS events are now handled as COMBAT events with isBossFight flag

      case "NPC_ENCOUNTER":
        return [
          {
            id: "TALK",
            label: "Talk",
            description: "Engage in conversation",
            icon: "💬",
            risk: "none",
          },
          {
            id: "TRADE",
            label: "Trade",
            description: "Exchange goods",
            icon: "🤝",
            risk: "low",
          },
          {
            id: "IGNORE",
            label: "Ignore",
            description: "Walk past them",
            icon: "🚶",
            risk: "none",
          },
          {
            id: "THREATEN",
            label: "Threaten",
            description: "Intimidate them",
            icon: "😠",
            risk: "medium",
          },
          {
            id: "BRIBE",
            label: "Bribe",
            description: "Pay for information/help",
            icon: "💰",
            risk: "low",
          },
        ];

      case "ENVIRONMENTAL_HAZARD":
        return [
          {
            id: "AVOID",
            label: "Avoid",
            description: "Try to dodge the hazard",
            icon: "🤸",
            risk: "medium",
          },
          {
            id: "ENDURE",
            label: "Endure",
            description: "Push through it",
            icon: "💪",
            risk: "high",
          },
          {
            id: "WAIT",
            label: "Wait",
            description: "Wait for it to pass",
            icon: "⏳",
            risk: "low",
          },
          {
            id: "COUNTER",
            label: "Counter",
            description: "Use environment against it",
            icon: "🔄",
            risk: "high",
          },
        ];

      case "REST":
        return [
          {
            id: "REST",
            label: "Rest",
            description: "Recover health and energy",
            icon: "😴",
            risk: "none",
          },
          {
            id: "MEDITATE",
            label: "Meditate",
            description: "Focus and gain wisdom",
            icon: "🧘",
            risk: "none",
          },
          {
            id: "TRAIN",
            label: "Train",
            description: "Practice skills",
            icon: "💪",
            risk: "none",
          },
          {
            id: "SKIP_REST",
            label: "Skip Rest",
            description: "Continue without resting",
            icon: "🚶",
            risk: "none",
          },
        ];

      case "BETRAYAL_OPPORTUNITY":
        return [
          {
            id: "BETRAY",
            label: "Betray",
            description: "Turn against your party",
            icon: "🗡️",
            risk: "very_high",
          },
          {
            id: "WARN",
            label: "Warn Party",
            description: "Alert your allies",
            icon: "⚠️",
            risk: "medium",
          },
          {
            id: "IGNORE",
            label: "Ignore",
            description: "Pretend you didn't see it",
            icon: "🙈",
            risk: "low",
          },
          {
            id: "EXPLOIT",
            label: "Exploit",
            description: "Use the situation cleverly",
            icon: "🧠",
            risk: "high",
          },
        ];

      default:
        return [
          {
            id: "INTERACT",
            label: "Interact",
            description: "Interact with the event",
            icon: "👆",
            risk: "medium",
          },
        ];
    }
  };

  const handleActionSubmit = () => {
    if (selectedAction) {
      const actionData = {
        actionType: selectedAction,
        timestamp: new Date().toISOString(),
        ...(selectedAction === "ATTACK" && { target: "enemy" }),
        ...(selectedAction === "USE_ITEM" && { itemId: "health_potion" }),
        ...(selectedAction === "FLEE" && { direction: "back" }),
        ...(minigameResult && { minigameResult }),
      };

      onActionSubmit(selectedAction, actionData);
    }
  };

  const handleMinigameComplete = (result: any) => {
    setMinigameResult(result);
    setShowMinigame(false);
    // Auto-submit the action with minigame result
    const actionData = {
      actionType: "MINIGAME_COMPLETE",
      timestamp: new Date().toISOString(),
      minigameResult: result,
    };
    onActionSubmit("MINIGAME_COMPLETE", actionData);
  };

  const handleStartMinigame = () => {
    setShowMinigame(true);
  };

  // Check if we have saved combat state - if so, auto-start the minigame
  const hasSavedCombatState =
    event?.eventData?.combatState &&
    (event.eventData.combatState.monsters ||
      event.eventData.combatState.turnCount > 0);

  // Auto-start minigame if we have saved state, otherwise show start button
  const shouldShowStartButton = !showMinigame && !hasSavedCombatState;
  const shouldShowMinigame = showMinigame || hasSavedCombatState;

  // Auto-start minigame when we detect saved combat state
  useEffect(() => {
    if (hasSavedCombatState && !showMinigame) {
      console.log(
        "🔄 [EventCard] Auto-starting minigame due to saved combat state"
      );
      setShowMinigame(true);
    }
  }, [hasSavedCombatState, showMinigame]);

  const getMinigameConfig = (event: any, minigameType: string) => {
    if (minigameType === "COMBAT_CLICKER") {
      // Use template config if available, otherwise use defaults
      const template = event.template || {};
      const config = template.config || {};

      // For the new monster template system, we need to pass the template IDs and generation parameters
      const combatConfig = {
        monsterTemplateIds: config.monsterTemplateIds || [],
        minMonsters: config.minMonsters || 1,
        maxMonsters: config.maxMonsters || 3,
        eliteChance: config.eliteChance || 0.2,
        specialAbilityChance: config.specialAbilityChance || 0.1,
        // Keep other config properties for backward compatibility
        timeLimit: config.timeLimit || 120,
        environments: config.environments || ["cave"],
        enemyTypes: config.enemyTypes || ["monster"],
        // Legacy properties for fallback
        monsterCount:
          config.monsterCount || event.eventData?.enemies?.length || 2,
        monsterHealth: config.monsterHealth || 80,
        monsterAttack: config.monsterAttack || 8,
        attackInterval: config.attackInterval || 4,
        monsterName: config.monsterName || "Monster",
      };

      return combatConfig;
    }

    // For other minigames, return the event data as-is
    return event.eventData || {};
  };

  const eventType = event.type || event.template?.type || "UNKNOWN";
  const availableActions = getAvailableActions(eventType, event.eventData);
  const minigameType = getMinigameTypeForEvent({
    type: eventType,
    template: event.template
      ? { minigameType: event.template.minigameType }
      : undefined,
  });
  const requiresMinigame = minigameType !== "NONE";

  return (
    <div
      className={`bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl ${getEventTypeColor(
        eventType,
        event.eventData
      )}`}
    >
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">
          {getEventTypeIcon(eventType, event.eventData)}
        </span>
        <div>
          <h3 className="text-xl font-bold text-white">
            {event.template?.name || eventType}
          </h3>
          <p className="text-gray-300 text-sm">
            {event.template?.description ||
              `A ${eventType.toLowerCase()} event`}
          </p>
          <p className="text-xs text-gray-500">
            Status: {event.status} | ID: {event.id} | Actions:{" "}
            {event.playerActions.length}
          </p>
        </div>
      </div>

      {/* Event Data Display */}
      {event.eventData && minigameType !== "COMBAT_CLICKER" && (
        <div className="mb-4 p-3 bg-black/10 backdrop-blur-sm border border-white/5 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Event Details:</h4>
          <div className="text-gray-300 text-sm space-y-1">
            {event.type === "COMBAT" && event.eventData.enemies && (
              <p>Enemies: {event.eventData.enemies.length}</p>
            )}
            {event.type === "TREASURE" && event.eventData.treasures && (
              <p>Treasures: {event.eventData.treasures.length}</p>
            )}
            {event.type === "TRAP" && event.eventData.trapType && (
              <p>Trap Type: {event.eventData.trapType}</p>
            )}
            {event.type === "COMBAT" &&
              event.eventData.isBossFight &&
              event.eventData.bossType && (
                <p>Boss: {event.eventData.bossType}</p>
              )}
            {event.eventData.timeLimit && (
              <p>Time Limit: {event.eventData.timeLimit}s</p>
            )}
          </div>
        </div>
      )}

      {/* Player Actions */}
      {event.playerActions.length > 0 && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
          <h4 className="text-white font-semibold mb-2">Player Actions:</h4>
          <div className="space-y-1">
            {event.playerActions.map((action, index) => (
              <div key={index} className="text-gray-300 text-sm">
                <span className="font-semibold">
                  {action.character?.name || "Unknown Player"}
                </span>
                : {action.actionType}
                <span className="text-xs text-gray-500 ml-2">
                  (Event: {event.id}, Action: {action.id})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Results */}
      {event.status === "COMPLETED" && event.results && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-green-500/30">
          <h4 className="text-white font-semibold mb-2">Event Results:</h4>
          <div className="space-y-2 text-sm">
            {/* Debug: Log event results */}
            {console.log("🔍 EventCard received results:", event.results)}
            {event.results.type === "combat" && (
              <>
                {event.results.victory && (
                  <div className="text-green-400 font-semibold">
                    🎉 Victory!
                  </div>
                )}
                {event.results.enemiesDefeated > 0 && (
                  <div className="text-gray-300">
                    Enemies Defeated:{" "}
                    <span className="text-orange-400">
                      {event.results.enemiesDefeated}
                    </span>
                  </div>
                )}
                {event.results.damage &&
                  Object.keys(event.results.damage).length > 0 && (
                    <div className="text-gray-300">
                      Damage Dealt:{" "}
                      <span className="text-red-400">
                        {Object.values(
                          event.results.damage as Record<string, number>
                        ).reduce((a: number, b: number) => a + b, 0)}
                      </span>
                    </div>
                  )}
                {event.results.experience > 0 && (
                  <div className="text-gray-300">
                    Experience:{" "}
                    <span className="text-yellow-400">
                      +{event.results.experience} XP
                    </span>
                  </div>
                )}
                {event.results.gold > 0 && (
                  <div className="text-gray-300">
                    Gold:{" "}
                    <span className="text-yellow-400">
                      +{event.results.gold}
                    </span>
                  </div>
                )}
                {event.results.generatedLoot &&
                  event.results.generatedLoot.length > 0 && (
                    <div className="text-gray-300">
                      <div className="font-semibold text-blue-400 mb-1">
                        Loot Obtained:
                      </div>
                      <div className="space-y-1">
                        {event.results.generatedLoot.map(
                          (loot: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <span className="text-gray-300">
                                {loot.itemName} x{loot.quantity}
                              </span>
                              <span
                                className={`text-xs px-1 py-0.5 rounded ${
                                  loot.rarity === "LEGENDARY"
                                    ? "bg-purple-600 text-purple-100"
                                    : loot.rarity === "RARE"
                                    ? "bg-blue-600 text-blue-100"
                                    : loot.rarity === "UNCOMMON"
                                    ? "bg-green-600 text-green-100"
                                    : "bg-gray-600 text-gray-100"
                                }`}
                              >
                                {loot.rarity}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </>
            )}
            {event.results.type === "treasure" && (
              <>
                {event.results.gold > 0 && (
                  <div className="text-gray-300">
                    Gold Found:{" "}
                    <span className="text-yellow-400">
                      +{event.results.gold}
                    </span>
                  </div>
                )}
                {event.results.items && event.results.items.length > 0 && (
                  <div className="text-gray-300">
                    Items Found:{" "}
                    <span className="text-blue-400">
                      {event.results.items.length}
                    </span>
                  </div>
                )}
                {event.results.experience > 0 && (
                  <div className="text-gray-300">
                    Experience:{" "}
                    <span className="text-yellow-400">
                      +{event.results.experience} XP
                    </span>
                  </div>
                )}
              </>
            )}
            {event.results.type === "trap" && (
              <>
                {event.results.damage &&
                  Object.keys(event.results.damage).length > 0 && (
                    <div className="text-gray-300">
                      Damage Taken:{" "}
                      <span className="text-red-400">
                        {Object.values(
                          event.results.damage as Record<string, number>
                        ).reduce((a: number, b: number) => a + b, 0)}
                      </span>
                    </div>
                  )}
                {event.results.experience > 0 && (
                  <div className="text-gray-300">
                    Experience:{" "}
                    <span className="text-yellow-400">
                      +{event.results.experience} XP
                    </span>
                  </div>
                )}
              </>
            )}
            {event.results.type === "choice" && (
              <>
                {event.results.reputation && (
                  <div className="text-gray-300">
                    Reputation:{" "}
                    <span
                      className={
                        event.results.reputation > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {event.results.reputation > 0 ? "+" : ""}
                      {event.results.reputation}
                    </span>
                  </div>
                )}
                {event.results.experience > 0 && (
                  <div className="text-gray-300">
                    Experience:{" "}
                    <span className="text-yellow-400">
                      +{event.results.experience} XP
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Minigame or Action Selection */}
      {!hasSubmitted && event.status === "ACTIVE" && (
        <div className="space-y-4">
          {requiresMinigame ? (
            <div className="space-y-4">
              {shouldShowStartButton ? (
                <div className="text-center">
                  <h4 className="text-white font-semibold mb-4">
                    {eventType === "COMBAT"
                      ? "Combat Challenge"
                      : `${eventType} Challenge`}
                  </h4>
                  <p className="text-gray-300 mb-4">
                    {eventType === "COMBAT"
                      ? "Click monsters to attack! They'll fight back every few seconds."
                      : `This ${eventType.toLowerCase()} requires a minigame challenge.`}
                  </p>
                  <button
                    onClick={handleStartMinigame}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-lg"
                  >
                    Start Challenge
                  </button>
                </div>
              ) : shouldShowMinigame ? (
                <MinigameContainer
                  type={minigameType}
                  config={getMinigameConfig(event, minigameType)}
                  playerStats={playerStats}
                  partyMembers={partyMembers}
                  event={event}
                  onComplete={handleMinigameComplete}
                />
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Choose Your Action:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableActions.map((action) => {
                  const getRiskColor = (risk: string) => {
                    switch (risk) {
                      case "none":
                        return "text-green-400";
                      case "low":
                        return "text-blue-400";
                      case "medium":
                        return "text-yellow-400";
                      case "high":
                        return "text-orange-400";
                      case "very_high":
                        return "text-red-400";
                      default:
                        return "text-gray-400";
                    }
                  };

                  return (
                    <button
                      key={action.id}
                      onClick={() => setSelectedAction(action.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedAction === action.id
                          ? "border-blue-500 bg-blue-900/30"
                          : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{action.icon}</span>
                        <div className="font-semibold text-white">
                          {action.label}
                        </div>
                        <span
                          className={`text-xs ${getRiskColor(action.risk)}`}
                        >
                          {action.risk.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {action.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedAction && (
                <div className="flex justify-end">
                  <button
                    onClick={handleActionSubmit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Submit Action
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {hasSubmitted && (
        <div className="text-center p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
          <p className="text-blue-400 font-semibold">Action Submitted!</p>
          <p className="text-gray-300 text-sm">
            {event.status === "RESOLVING"
              ? "Resolving event..."
              : event.status === "COMPLETED"
              ? "Event completed!"
              : "Processing your action..."}
          </p>
        </div>
      )}

      {/* Player Stats Display */}
    </div>
  );
}
