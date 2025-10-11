"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Sword, Shield, Zap, Star, Crown } from "@/components/icons";
import { api } from "@/trpc/react";
import {
  CombatStateManager,
  type CombatPartyMember,
  type EnhancedMonster,
  type DamageEvent,
} from "@/lib/combat/CombatStateManager";

interface CombatClickerGameProps {
  config: {
    monsterTemplateIds: string[];
    minMonsters: number;
    maxMonsters: number;
    eliteChance: number;
    specialAbilityChance: number;
  };
  playerStats: {
    attack: number;
    defense: number;
    health: number;
    maxHealth: number;
    agility: number;
    blockStrength: number;
  };
  partyMembers: Array<{
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    agility: number;
    blockStrength: number;
  }>;
  onComplete: (result: {
    victory: boolean;
    timeTaken: number;
    totalClicks: number;
    damageDealt: number;
    damageTaken: Record<string, number>;
    blocks: number;
    parries: number;
    perfectParries: number;
    playersRevived: number;
    contributionByPlayer: Record<string, number>;
    partyHealthUpdates: Record<string, number>;
  }) => void;
}

export function CombatClickerGame({
  config,
  playerStats,
  partyMembers,
  onComplete,
}: CombatClickerGameProps) {
  const [gameState, setGameState] = useState<{
    monsters: EnhancedMonster[];
    party: CombatPartyMember[];
    blockStates: Record<string, any>;
    damageLog: DamageEvent[];
    gameActive: boolean;
    gameOver: boolean;
    victory: boolean;
    timeStarted: number;
    timeTaken: number;
  }>({
    monsters: [],
    party: [],
    blockStates: {},
    damageLog: [],
    gameActive: false,
    gameOver: false,
    victory: false,
    timeStarted: 0,
    timeTaken: 0,
  });

  const combatManager = useRef<CombatStateManager | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const attackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate monsters using tRPC
  const { data: monsters, isLoading: monstersLoading } =
    api.monster.generateCombatMonsters.useQuery(
      {
        templateIds: config.monsterTemplateIds || [],
        minMonsters: config.minMonsters || 1,
        maxMonsters: config.maxMonsters || 3,
        eliteChance: config.eliteChance || 0.2,
        specialAbilityChance: config.specialAbilityChance || 0.1,
      },
      {
        enabled:
          config &&
          config.monsterTemplateIds &&
          config.monsterTemplateIds.length > 0,
      }
    );

  // Initialize combat when monsters are loaded
  useEffect(() => {
    if (monsters && monsters.length > 0 && !gameState.gameActive) {
      console.log(
        "🎮 [CombatClickerGame] Initializing combat with monsters:",
        monsters
      );

      // Create combat manager
      combatManager.current = new CombatStateManager();

      // Convert party members to combat format
      const combatParty: CombatPartyMember[] = partyMembers.map((member) => ({
        id: member.id,
        name: member.name,
        currentHealth: member.health,
        maxHealth: member.maxHealth,
        attack: member.attack,
        defense: member.defense,
        agility: member.agility,
        blockStrength: member.blockStrength,
        isDead: false,
      }));

      // Initialize combat
      combatManager.current.initializeCombat(combatParty, config);
      combatManager.current.setMonsters(monsters);

      // Get initial state
      const initialState = combatManager.current.getState();

      setGameState((prev) => ({
        ...prev,
        monsters: initialState.monsters,
        party: initialState.party,
        blockStates: initialState.blockStates,
        damageLog: initialState.damageLog,
        gameActive: true,
        timeStarted: initialState.gameStartTime,
      }));
    }
  }, [monsters, partyMembers, config, gameState.gameActive]);

  // Game timer
  useEffect(() => {
    if (!gameState.gameActive || gameState.gameOver) return;

    gameTimerRef.current = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        timeTaken: Date.now() - prev.timeStarted,
      }));
    }, 100);

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, [gameState.gameActive, gameState.gameOver]);

  // Monster attack timer
  useEffect(() => {
    if (!gameState.gameActive || gameState.gameOver || !combatManager.current)
      return;

    const checkAttacks = () => {
      const now = Date.now();
      const aliveMonsters = gameState.monsters.filter(
        (monster) => monster.health > 0
      );

      aliveMonsters.forEach((monster) => {
        if (now >= monster.nextAttackTime) {
          // Show block button 2 seconds before attack
          combatManager.current?.showBlockButton(monster.id);

          // Schedule the actual attack
          setTimeout(() => {
            performMonsterAttack(monster.id);
          }, 2000);

          // Set next attack time
          combatManager.current?.setNextAttackTime(monster.id);
        }
      });
    };

    attackTimerRef.current = setInterval(checkAttacks, 100);

    return () => {
      if (attackTimerRef.current) {
        clearInterval(attackTimerRef.current);
      }
    };
  }, [gameState.gameActive, gameState.gameOver, gameState.monsters]);

  // Update block timing states for visual feedback
  useEffect(() => {
    if (!gameState.gameActive || gameState.gameOver || !combatManager.current)
      return;

    const updateBlockStates = () => {
      const newState = combatManager.current?.getState();
      if (newState) {
        setGameState((prev) => ({
          ...prev,
          blockStates: newState.blockStates,
        }));
      }
    };

    const blockUpdateInterval = setInterval(updateBlockStates, 50); // Update every 50ms for smooth animation

    return () => {
      clearInterval(blockUpdateInterval);
    };
  }, [gameState.gameActive, gameState.gameOver]);

  const performMonsterAttack = (monsterId: string) => {
    if (!combatManager.current) return;

    const aliveMembers = gameState.party.filter((member) => !member.isDead);
    if (aliveMembers.length === 0) return;

    // Pick random target
    const target =
      aliveMembers[Math.floor(Math.random() * aliveMembers.length)];

    // Get the stored block status from when player clicked
    const blockState = gameState.blockStates[monsterId];
    const blockStatus = blockState?.blockStatus || "none";

    // Process attack
    const result = combatManager.current.processMonsterAttack(
      monsterId,
      target.id,
      blockStatus
    );

    // Hide block button
    combatManager.current.hideBlockButton(monsterId);

    // Update state
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      monsters: newState.monsters,
      party: newState.party,
      blockStates: newState.blockStates,
      damageLog: newState.damageLog,
    }));
  };

  const handleMonsterClick = (monsterId: string) => {
    if (!gameState.gameActive || gameState.gameOver || !combatManager.current)
      return;

    // Find the current player (assuming first party member for now)
    const currentPlayer = gameState.party[0];
    if (!currentPlayer || currentPlayer.isDead) return;

    // Process attack
    const result = combatManager.current.processPartyAttack(
      currentPlayer.id,
      monsterId
    );

    // Update state
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      monsters: newState.monsters,
      party: newState.party,
      damageLog: newState.damageLog,
    }));
  };

  const handleBlockClick = (monsterId: string) => {
    if (!gameState.gameActive || gameState.gameOver || !combatManager.current)
      return;

    const blockState = gameState.blockStates[monsterId];
    if (!blockState || !blockState.isVisible) return;

    const clickTime = Date.now();

    // Register the block attempt in the combat manager
    combatManager.current.registerBlockAttempt(monsterId, clickTime);

    // Update UI state
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      blockStates: newState.blockStates,
    }));
  };

  const handleReviveClick = (memberId: string) => {
    if (!gameState.gameActive || gameState.gameOver || !combatManager.current)
      return;

    const success = combatManager.current.revivePartyMember(memberId);
    if (success) {
      const newState = combatManager.current.getState();
      setGameState((prev) => ({
        ...prev,
        party: newState.party,
        damageLog: newState.damageLog,
      }));
    }
  };

  // Check win/lose conditions
  useEffect(() => {
    if (!gameState.gameActive || gameState.gameOver || !combatManager.current)
      return;

    const { isOver, victory } = combatManager.current.checkGameEnd();

    if (isOver) {
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        victory,
        gameActive: false,
      }));
    }
  }, [
    gameState.monsters,
    gameState.party,
    gameState.gameActive,
    gameState.gameOver,
  ]);

  // Complete game when over
  useEffect(() => {
    if (gameState.gameOver && combatManager.current) {
      const result = combatManager.current.getCombatResult();
      onComplete(result);
    }
  }, [gameState.gameOver, onComplete]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (attackTimerRef.current) {
        clearInterval(attackTimerRef.current);
      }
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, []);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  const getMonsterTypeIcon = (type: string) => {
    switch (type) {
      case "WARRIOR":
        return "⚔️";
      case "RANGER":
        return "🏹";
      case "MAGE":
        return "🔮";
      case "HEALER":
        return "✨";
      case "TANK":
        return "🛡️";
      case "BERSERKER":
        return "💀";
      default:
        return "👹";
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "COMMON":
        return "border-gray-500";
      case "ELITE":
        return "border-yellow-500";
      case "RARE":
        return "border-purple-500";
      case "BOSS":
        return "border-red-500";
      default:
        return "border-gray-500";
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "ELITE":
        return <Star className="h-4 w-4 text-yellow-400" />;
      case "RARE":
        return <Star className="h-4 w-4 text-purple-400" />;
      case "BOSS":
        return <Crown className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  if (monstersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading monsters...</div>
      </div>
    );
  }

  // If no monsters are available and we're not loading, show an error
  if (!monsters || monsters.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️ No monsters available</div>
          <div className="text-gray-300 text-sm">
            {config &&
            config.monsterTemplateIds &&
            config.monsterTemplateIds.length === 0
              ? "No monster templates configured for this event."
              : "Failed to generate monsters for this combat event."}
          </div>
          <div className="text-gray-400 text-xs mt-2">
            Config: {JSON.stringify(config, null, 2)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Game Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Combat Challenge</h3>
        <p className="text-gray-400 text-sm mb-4">
          Click monsters to attack! Block their attacks by clicking the block
          buttons.
        </p>

        {/* Blocking Instructions */}
        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 mb-4 text-left">
          <h4 className="text-white font-semibold mb-2">🛡️ Blocking System:</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span>
                <strong>Blue:</strong> Warning phase - Block button appears
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span>
                <strong>Green:</strong> Block window - Click to reduce damage
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded animate-pulse"></div>
              <span>
                <strong>Yellow:</strong> Parry window - Click for PERFECT BLOCK!
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-600">
              <span className="text-gray-400">
                <strong>Note:</strong> Faster monsters have shorter, more
                challenging windows!
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Sword className="h-4 w-4 text-orange-400" />
            <span className="text-white">Attack: {playerStats.attack}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-white">Defense: {playerStats.defense}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-white">
              Time: {formatTime(gameState.timeTaken)}
            </span>
          </div>
        </div>
      </div>

      {/* Monsters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {gameState.monsters.map((monster) => (
          <div
            key={monster.id}
            className={`relative bg-red-900/50 border-2 rounded-lg p-4 transition-all duration-200 ${getRarityColor(
              monster.rarity
            )} ${
              monster.health > 0
                ? "hover:bg-red-900/70"
                : "border-gray-600 bg-gray-800/50"
            }`}
          >
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-4xl">
                  {getMonsterTypeIcon(monster.type)}
                </span>
                {getRarityIcon(monster.rarity)}
              </div>
              <h4 className="text-lg font-semibold text-white mb-1">
                {monster.name}
              </h4>
              <div className="text-xs text-gray-300 mb-2">
                {monster.type} • {monster.rarity}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Speed: {(monster.attackInterval / 1000).toFixed(1)}s • Attack:{" "}
                {monster.attack} • Defense: {monster.defense}
              </div>

              {/* Health Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    monster.health > monster.maxHealth * 0.5
                      ? "bg-green-500"
                      : monster.health > monster.maxHealth * 0.25
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${(monster.health / monster.maxHealth) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-gray-300 mb-3">
                {monster.health}/{monster.maxHealth} HP
              </p>

              {/* Attack Button */}
              {monster.health > 0 && (
                <button
                  onClick={() => handleMonsterClick(monster.id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold transition-colors"
                >
                  Attack
                </button>
              )}

              {/* Block Button with Visual Feedback */}
              {gameState.blockStates[monster.id]?.isVisible &&
                (() => {
                  const timingState =
                    combatManager.current?.getBlockTimingState(monster.id);
                  const isHolding =
                    gameState.blockStates[monster.id]?.isHolding;

                  // Determine button color based on timing
                  let buttonClass =
                    "w-full mt-2 px-4 py-2 rounded font-semibold transition-all duration-100 ";
                  let buttonText = "Block!";

                  if (isHolding) {
                    buttonClass += "bg-blue-700 text-blue-200";
                    buttonText = "Blocking...";
                  } else if (timingState?.isInParryWindow) {
                    buttonClass +=
                      "bg-yellow-500 text-yellow-900 animate-pulse shadow-lg shadow-yellow-500/50";
                    buttonText = "PARRY NOW!";
                  } else if (timingState?.isInBlockWindow) {
                    buttonClass += "bg-green-600 text-white hover:bg-green-700";
                    buttonText = "Block!";
                  } else {
                    buttonClass += "bg-blue-600 text-white hover:bg-blue-700";
                    buttonText = "Block!";
                  }

                  return (
                    <div className="space-y-2">
                      {/* Timing Progress Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-100 ${
                            timingState?.isInParryWindow
                              ? "bg-yellow-400"
                              : timingState?.isInBlockWindow
                              ? "bg-green-400"
                              : "bg-blue-400"
                          }`}
                          style={{
                            width: `${(timingState?.progress || 0) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Time Display */}
                      {timingState && timingState.timeUntilAttack > 0 && (
                        <div className="text-xs text-center text-gray-300 space-y-1">
                          {timingState.isInParryWindow ? (
                            <div>
                              <span className="text-yellow-400 font-bold">
                                PARRY WINDOW!{" "}
                                {(timingState.timeUntilAttack / 1000).toFixed(
                                  1
                                )}
                                s
                              </span>
                              <div className="text-yellow-300">
                                ({timingState.parryWindow}ms window)
                              </div>
                            </div>
                          ) : timingState.isInBlockWindow ? (
                            <div>
                              <span className="text-green-400">
                                Block Window:{" "}
                                {(timingState.timeUntilAttack / 1000).toFixed(
                                  1
                                )}
                                s
                              </span>
                              <div className="text-green-300">
                                ({timingState.blockWindow}ms window)
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-blue-400">
                                Warning:{" "}
                                {(timingState.timeUntilAttack / 1000).toFixed(
                                  1
                                )}
                                s
                              </span>
                              <div className="text-blue-300">
                                (Speed: {timingState.attackSpeed.toFixed(1)}x)
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Block Button */}
                      <button
                        onClick={() => handleBlockClick(monster.id)}
                        className={buttonClass}
                      >
                        {buttonText}
                      </button>
                    </div>
                  );
                })()}
            </div>
          </div>
        ))}
      </div>

      {/* Party Status */}
      <div className="w-full max-w-4xl">
        <h4 className="text-lg font-semibold text-white mb-3 text-center">
          Party Status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gameState.party.map((member) => (
            <div
              key={member.id}
              className={`bg-gray-800/50 border-2 rounded-lg p-3 ${
                member.isDead
                  ? "border-red-500 bg-red-900/20"
                  : "border-gray-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{member.name}</span>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-gray-300">
                    {member.currentHealth}/{member.maxHealth}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    member.currentHealth > member.maxHealth * 0.5
                      ? "bg-green-500"
                      : member.currentHealth > member.maxHealth * 0.25
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${
                      (member.currentHealth / member.maxHealth) * 100
                    }%`,
                  }}
                />
              </div>
              {member.isDead && (
                <button
                  onClick={() => handleReviveClick(member.id)}
                  className="w-full mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Click to Revive
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Damage Log */}
      {gameState.damageLog.length > 0 && (
        <div className="w-full max-w-4xl">
          <h4 className="text-lg font-semibold text-white mb-3 text-center">
            Combat Log
          </h4>
          <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-3 max-h-32 overflow-y-auto">
            {gameState.damageLog.slice(-10).map((event) => (
              <div key={event.id} className="text-sm text-gray-300 mb-1">
                <span className="text-gray-400">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>{" "}
                <span
                  className={
                    event.type === "damage_dealt"
                      ? "text-green-400"
                      : event.type === "damage_taken"
                      ? "text-red-400"
                      : event.type === "heal"
                      ? "text-blue-400"
                      : event.type === "parry"
                      ? "text-yellow-400 font-bold"
                      : event.type === "block"
                      ? "text-green-300"
                      : "text-gray-300"
                  }
                >
                  {event.source}{" "}
                  {event.type === "damage_dealt"
                    ? "attacks"
                    : event.type === "damage_taken"
                    ? "takes"
                    : event.type === "heal"
                    ? "heals"
                    : event.type === "parry"
                    ? "PARRYS"
                    : event.type === "block"
                    ? "blocks"
                    : "affects"}{" "}
                  {event.target}
                  {event.amount > 0 && ` for ${event.amount} damage`}
                  {event.isCritical && " (CRITICAL!)"}
                  {event.type === "parry" && " - PERFECT PARRY!"}
                  {event.type === "block" && " - BLOCKED!"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-gray-600 rounded-lg p-8 text-center max-w-md">
            <div className="text-6xl mb-4">
              {gameState.victory ? "🎉" : "💀"}
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {gameState.victory ? "Victory!" : "Defeat!"}
            </h2>
            <div className="space-y-2 text-gray-300 mb-6">
              <p>Time: {formatTime(gameState.timeTaken)}</p>
              <p>
                Monsters Defeated:{" "}
                {gameState.monsters.filter((m) => m.health <= 0).length}
              </p>
            </div>
            <p className="text-sm text-gray-400">
              Results will be processed automatically...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
