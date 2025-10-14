"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Sword, Shield, Zap, Star, Crown } from "@/components/icons";
import { api } from "@/trpc/react";
import { useDungeonSession } from "@/contexts/DungeonSessionContext";
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
    currentHealth: number;
    maxHealth: number;
    attack: number;
    defense: number;
    agility: number;
    blockStrength: number;
  }>;
  event?: {
    eventData?: {
      combatState?: any;
    };
  };
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
  event,
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

  // State for click animations
  const [clickedMonsters, setClickedMonsters] = useState<
    Record<
      string,
      {
        isPulsing: boolean;
        damage: number;
        position: { x: number; y: number };
      }
    >
  >({});

  const combatManager = useRef<CombatStateManager | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const attackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scheduledAttacks = useRef<Set<string>>(new Set());
  const attackTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Helper functions for monster images
  const getMonsterImagePath = (monsterName: string): string => {
    // Convert "Training Dummy" to "training_dummy.png"
    const imageName = monsterName.toLowerCase().replace(/\s+/g, "_");
    return `/assets/${imageName}.png`;
  };

  const getMonsterImageWithFallback = (monsterName: string): string => {
    const imagePath = getMonsterImagePath(monsterName);
    // For images that don't exist, fallback to training_dummy.png
    // We'll handle this with onError in the img tag
    return imagePath;
  };

  // Get refetch function from context
  const { refetchCharacter, submitAction } = useDungeonSession();

  // Mutation to update character health in real-time
  const updateCharacterHealth = api.character.updateHealth.useMutation({
    onSuccess: () => {
      // Trigger a refetch of character data to update the party sidebar
      refetchCharacter();
    },
  });

  // Check if we have saved combat state first
  const hasSavedCombatState =
    event?.eventData?.combatState?.monsters &&
    event.eventData.combatState.monsters.length > 0;

  // Simple debug log that should always show
  console.log("🔍 SIMPLE DEBUG:", {
    hasEvent: !!event,
    hasEventData: !!event?.eventData,
    hasCombatState: !!event?.eventData?.combatState,
    hasMonsters: !!event?.eventData?.combatState?.monsters,
    monstersLength: event?.eventData?.combatState?.monsters?.length || 0,
    hasSavedCombatState,
  });

  // Debug saved state detection (only log when it changes)
  useEffect(() => {
    console.log("🎮 [CombatClickerGame] Saved state check:", {
      hasEvent: !!event,
      hasEventData: !!event?.eventData,
      hasCombatState: !!event?.eventData?.combatState,
      hasMonsters: !!event?.eventData?.combatState?.monsters,
      monstersLength: event?.eventData?.combatState?.monsters?.length || 0,
      hasSavedCombatState,
      eventData: event?.eventData,
      combatState: event?.eventData?.combatState,
    });
  }, [hasSavedCombatState, event?.eventData?.combatState]);

  // Debug query conditions
  const queryEnabled =
    !hasSavedCombatState &&
    config &&
    config.monsterTemplateIds &&
    config.monsterTemplateIds.length > 0;

  useEffect(() => {
    console.log("🎮 [CombatClickerGame] Query conditions:", {
      hasSavedCombatState,
      hasConfig: !!config,
      hasTemplateIds: !!config?.monsterTemplateIds,
      templateIdsLength: config?.monsterTemplateIds?.length || 0,
      queryEnabled,
    });
  }, [hasSavedCombatState, config, queryEnabled]);

  // Generate monsters using tRPC only if we don't have saved state
  const {
    data: monsters,
    isLoading: monstersLoading,
    error: monstersError,
  } = api.monster.generateCombatMonsters.useQuery(
    {
      templateIds: config.monsterTemplateIds || [],
      minMonsters: config.minMonsters || 1,
      maxMonsters: config.maxMonsters || 3,
      eliteChance: config.eliteChance || 0.2,
      specialAbilityChance: config.specialAbilityChance || 0.1,
    },
    {
      enabled: queryEnabled,
    }
  );

  // Debug monster generation results
  useEffect(() => {
    if (queryEnabled) {
      console.log("🎮 [CombatClickerGame] Monster generation query results:", {
        isLoading: monstersLoading,
        hasData: !!monsters,
        monstersCount: monsters?.length || 0,
        error: monstersError,
        queryEnabled,
      });
    }
  }, [monsters, monstersLoading, monstersError, queryEnabled]);

  // Debug the monster generation configuration (only log once and only if no saved state)
  useEffect(() => {
    if (config && config.monsterTemplateIds && !hasSavedCombatState) {
      console.log("🎮 [CombatClickerGame] Monster generation config:", {
        templateIds: config.monsterTemplateIds || [],
        minMonsters: config.minMonsters || 1,
        maxMonsters: config.maxMonsters || 3,
        eliteChance: config.eliteChance || 0.2,
        specialAbilityChance: config.specialAbilityChance || 0.1,
      });
    }
  }, [config, hasSavedCombatState]);

  // Initialize combat when monsters are loaded OR when we have saved state
  useEffect(() => {
    const shouldInitialize =
      (monsters && monsters.length > 0) || hasSavedCombatState;

    console.log("🎮 [CombatClickerGame] Initialization check:", {
      shouldInitialize,
      hasMonsters: monsters && monsters.length > 0,
      hasSavedCombatState,
      gameActive: gameState.gameActive,
      monstersCount: monsters?.length || 0,
      combatManagerExists: !!combatManager.current,
      eventData: event?.eventData,
      combatState: event?.eventData?.combatState,
    });

    if (shouldInitialize && !gameState.gameActive && !combatManager.current) {
      console.log(
        "🎮 [CombatClickerGame] Initializing combat with monsters:",
        monsters || "saved state"
      );

      // Create combat manager
      combatManager.current = new CombatStateManager();

      // Convert party members to combat format
      const combatParty: CombatPartyMember[] = partyMembers.map((member) => ({
        id: member.id,
        name: member.name,
        currentHealth: member.currentHealth,
        maxHealth: member.maxHealth,
        attack: member.attack,
        defense: member.defense,
        agility: member.agility || 5,
        blockStrength: member.blockStrength || 3,
        isDead: member.currentHealth <= 0,
      }));

      console.log("🎮 [CombatClickerGame] Combat party:", combatParty);

      // Initialize combat
      combatManager.current.initializeCombat(combatParty, {
        templateIds: config.monsterTemplateIds,
        minMonsters: config.minMonsters,
        maxMonsters: config.maxMonsters,
        eliteChance: config.eliteChance,
        specialAbilityChance: config.specialAbilityChance,
      });

      // Use saved monsters if available, otherwise use generated ones
      let enhancedMonsters: EnhancedMonster[];

      if (hasSavedCombatState) {
        console.log(
          "🔄 [CombatClickerGame] Using saved monsters from combat state"
        );
        enhancedMonsters = event.eventData.combatState.monsters;
      } else {
        console.log("🎮 [CombatClickerGame] Using newly generated monsters");
        enhancedMonsters = monsters.map((monster) => ({
          ...monster,
          rarity: monster.rarity as "COMMON" | "ELITE" | "RARE" | "BOSS",
          description: monster.description || undefined,
        }));
      }

      console.log(
        "🎮 [CombatClickerGame] Enhanced monsters:",
        enhancedMonsters
      );
      combatManager.current.setMonsters(enhancedMonsters);

      // Restore previous combat state if exists
      if (event?.eventData?.combatState) {
        console.log("🔄 [CombatClickerGame] Restoring previous combat state");
        combatManager.current.restoreState(event.eventData.combatState);
      }

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

      // Clear any scheduled attacks when starting a new game
      scheduledAttacks.current.clear();
    }
  }, [
    monsters,
    partyMembers,
    config,
    gameState.gameActive,
    event?.eventData?.combatState,
    hasSavedCombatState,
  ]);

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

  // Game completion check - DISABLED (using immediate check instead)
  // useEffect(() => {
  //   if (!gameState.gameActive || gameState.gameOver || !combatManager.current)
  //     return;

  //   const checkGameCompletion = () => {
  //     const gameEnd = combatManager.current?.checkGameEnd();
  //     if (gameEnd?.isOver) {
  //       console.log("🎮 [CombatClickerGame] Game completed:", gameEnd);
  //       console.log("🎮 [CombatClickerGame] Alive monsters:", gameState.monsters.filter(m => m.health > 0).length);
  //       console.log("🎮 [CombatClickerGame] Alive party members:", gameState.party.filter(p => !p.isDead).length);

  //       // Get final combat result
  //       const combatResult = combatManager.current?.getCombatResult();
  //       console.log("🎮 [CombatClickerGame] Combat result:", combatResult);

  //       // Update game state to show game over screen
  //       setGameState((prev) => ({
  //         ...prev,
  //         gameOver: true,
  //         victory: gameEnd.victory,
  //       }));

  //       // Call onComplete callback after a short delay to show the game over screen
  //       setTimeout(() => {
  //         if (combatResult) {
  //           console.log(
  //             "🎮 [CombatClickerGame] Calling onComplete with result:",
  //             combatResult
  //           );
  //           onComplete(combatResult);
  //         }
  //       }, 2000); // Show game over screen for 2 seconds before completing
  //     }
  //   };

  //   // Check for completion every 500ms
  //   const completionCheckInterval = setInterval(checkGameCompletion, 500);

  //   return () => {
  //     clearInterval(completionCheckInterval);
  //   };
  // }, [gameState.gameActive, gameState.gameOver, onComplete]);

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
        if (
          now >= monster.nextAttackTime &&
          !scheduledAttacks.current.has(monster.id)
        ) {
          console.log(`🎯 Monster ${monster.name} attacking:`, {
            attackSpeed: monster.attackInterval,
            timeUntilAttack: monster.nextAttackTime - now,
            nextAttackTime: new Date(
              monster.nextAttackTime
            ).toLocaleTimeString(),
          });

          // Mark this monster as having a scheduled attack
          scheduledAttacks.current.add(monster.id);

          // Show block button 2 seconds before attack
          combatManager.current?.showBlockButton(monster.id);

          // Schedule the actual attack
          const attackTimeout = setTimeout(() => {
            // Check if monster is still alive before attacking
            const currentMonster = gameState.monsters.find(
              (m) => m.id === monster.id
            );
            if (!currentMonster || currentMonster.health <= 0) {
              console.log(
                `💀 Monster ${monster.name} died before attack could be performed, cancelling attack`
              );
              scheduledAttacks.current.delete(monster.id);
              attackTimeouts.current.delete(monster.id);
              return;
            }

            performMonsterAttack(monster.id);
            // Set next attack time AFTER the attack is performed
            combatManager.current?.setNextAttackTime(monster.id);
            // Remove from scheduled attacks after attack is performed
            scheduledAttacks.current.delete(monster.id);
            attackTimeouts.current.delete(monster.id);
          }, 2000);

          // Store the timeout ID so it can be cancelled if monster dies
          attackTimeouts.current.set(monster.id, attackTimeout);
        }
      });
    };

    attackTimerRef.current = setInterval(checkAttacks, 100);

    return () => {
      if (attackTimerRef.current) {
        clearInterval(attackTimerRef.current);
      }
      // Clear scheduled attacks and timeouts when component unmounts or effect changes
      scheduledAttacks.current.clear();
      attackTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      attackTimeouts.current.clear();
    };
  }, [gameState.gameActive, gameState.gameOver]);

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
    // Use the combat manager's state instead of React state for accuracy
    const combatState = combatManager.current.getState();
    const blockState = combatState.blockStates[monsterId];
    const blockStatus = blockState?.blockStatus || "none";

    // Process attack (this updates the local combat state)
    const result = combatManager.current.processMonsterAttack(
      monsterId,
      target.id,
      blockStatus
    );

    // Update character health in database if damage was taken
    // Only update the database, don't double-apply damage
    if (result.damage > 0) {
      // Get the updated health from the combat manager's state
      const updatedParty = combatManager.current.getState().party;
      const updatedTarget = updatedParty.find(
        (member) => member.id === target.id
      );
      if (updatedTarget) {
        updateCharacterHealth.mutate({
          characterId: target.id,
          newHealth: updatedTarget.currentHealth,
        });
      }
    }

    // Hide block button after a short delay to allow visual feedback to complete
    setTimeout(() => {
      combatManager.current?.hideBlockButton(monsterId);
    }, 500); // 500ms delay to allow attack animation to complete

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

  // Function to check if combat is over and complete the minigame
  const checkGameEnd = () => {
    if (!combatManager.current) return;

    const gameEndResult = combatManager.current.checkGameEnd();
    if (gameEndResult.isOver) {
      console.log("🎮 [CombatClickerGame] Combat ended:", {
        victory: gameEndResult.victory,
        isOver: gameEndResult.isOver,
      });

      // Get final combat result
      const finalResult = combatManager.current.getCombatResult();

      // Complete the minigame with final result
      onComplete(finalResult);
    }
  };

  // Function to cancel scheduled attacks for dead monsters
  const cancelDeadMonsterAttacks = () => {
    const aliveMonsterIds = new Set(
      gameState.monsters
        .filter((monster) => monster.health > 0)
        .map((monster) => monster.id)
    );

    // Cancel attacks for monsters that are no longer alive
    attackTimeouts.current.forEach((timeout, monsterId) => {
      if (!aliveMonsterIds.has(monsterId)) {
        console.log(`💀 Cancelling attack for dead monster ${monsterId}`);
        clearTimeout(timeout);
        attackTimeouts.current.delete(monsterId);
        scheduledAttacks.current.delete(monsterId);
        // Also hide the block button for dead monsters
        combatManager.current?.hideBlockButton(monsterId);
      }
    });
  };

  // Function to save combat state to backend (silently, no action logging)
  const saveCombatState = () => {
    if (!combatManager.current || !event) return;

    const combatState = combatManager.current.getState();
    const combatResult = combatManager.current.getCombatResult();

    console.log("💾 [CombatClickerGame] Saving combat state:", {
      monsters: combatState.monsters.length,
      turnCount: combatState.turnCount,
      damageDealt: combatResult.damageDealt,
      monstersDefeated: combatResult.monstersDefeated,
    });

    // Send combat state update to backend (silent, no action logging)
    submitAction("COMBAT_STATE_UPDATE", {
      combatState: {
        monsters: combatState.monsters,
        turnCount: combatState.turnCount,
        playerDamageDealt: combatResult.damageDealt,
        enemyDamageDealt: combatResult.damageTaken,
        monstersDefeated: combatResult.monstersDefeated,
        partyHealthUpdates: combatResult.partyHealthUpdates,
      },
    });
  };

  const handleMonsterClick = (monsterId: string, event: React.MouseEvent) => {
    console.log("🎮 [CombatClickerGame] handleMonsterClick called:", {
      monsterId,
      gameActive: gameState.gameActive,
      gameOver: gameState.gameOver,
      combatManagerExists: !!combatManager.current,
    });

    if (!gameState.gameActive || gameState.gameOver || !combatManager.current) {
      console.log(
        "🎮 [CombatClickerGame] Early return from handleMonsterClick"
      );
      return;
    }

    const currentPlayer = gameState.party[0];
    if (!currentPlayer || currentPlayer.isDead) {
      console.log("🎮 [CombatClickerGame] No valid player for attack");
      return;
    }

    console.log("🎮 [CombatClickerGame] Monster clicked:", {
      monsterId,
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      combatManagerExists: !!combatManager.current,
    });

    // Process attack
    const result = combatManager.current.processPartyAttack(
      currentPlayer.id,
      monsterId
    );

    console.log("🎮 [CombatClickerGame] Attack result:", result);

    // Trigger click animation with damage number
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setClickedMonsters((prev) => ({
      ...prev,
      [monsterId]: {
        isPulsing: true,
        damage: result.damage || 0,
        position: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      },
    }));

    // Remove pulse after animation
    setTimeout(() => {
      setClickedMonsters((prev) => {
        const updated = { ...prev };
        if (updated[monsterId]) {
          updated[monsterId].isPulsing = false;
        }
        return updated;
      });
    }, 300);

    // Update state
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      monsters: newState.monsters,
      party: newState.party,
      damageLog: newState.damageLog,
    }));

    // Cancel attacks for any monsters that died from this attack
    setTimeout(() => {
      cancelDeadMonsterAttacks();
    }, 0); // Run after state update

    // Save combat state after each attack (silently, no action logging)
    saveCombatState();
  };

  const handleBlockClick = (monsterId: string) => {
    if (!gameState.gameActive || gameState.gameOver || !combatManager.current)
      return;

    const blockState = gameState.blockStates[monsterId];
    if (!blockState || !blockState.isVisible) return;

    const clickTime = Date.now();

    // Register the block attempt in the combat manager
    // This will store the block status for the upcoming attack
    combatManager.current.registerBlockAttempt(monsterId, clickTime);

    // Update UI state
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      blockStates: newState.blockStates,
    }));
  };

  const handleMonsterRightClick = (
    monsterId: string,
    event: React.MouseEvent
  ) => {
    event.preventDefault(); // Prevent context menu

    if (!gameState.gameActive || gameState.gameOver || !combatManager.current)
      return;

    const blockState = gameState.blockStates[monsterId];
    if (!blockState || !blockState.isVisible) return;

    const clickTime = Date.now();
    combatManager.current.registerBlockAttempt(monsterId, clickTime);

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
    console.log("🎮 [CombatClickerGame] Win/lose check:", {
      isOver,
      victory,
      monsters: gameState.monsters.length,
      party: gameState.party.length,
    });

    if (isOver) {
      console.log(
        "🎮 [CombatClickerGame] Setting game over from win/lose check"
      );
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
      console.log(
        "🎮 [CombatClickerGame] Game over detected, getting combat result"
      );
      const result = combatManager.current.getCombatResult();
      console.log("🎮 [CombatClickerGame] Final combat result:", result);

      // Add delay to show game over screen before completing
      setTimeout(() => {
        console.log(
          "🎮 [CombatClickerGame] Calling onComplete with result:",
          result
        );
        console.log("🎮 [CombatClickerGame] Result details:", {
          victory: result.victory,
          monstersDefeated: result.monstersDefeated,
          totalClicks: result.totalClicks,
          damageDealt: result.damageDealt,
        });
        onComplete(result);
      }, 2000); // Show game over screen for 2 seconds before completing
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
      // Clear all attack timeouts
      attackTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      attackTimeouts.current.clear();
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
  // BUT only if we don't have saved state (which would have its own monsters)
  if (!hasSavedCombatState && (!monsters || monsters.length === 0)) {
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
      {/* Battle Area - 2 Column Layout */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Party Status */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-3 text-center">
              Party Status
            </h4>
            <div className="space-y-3">
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
                    <span className="text-white font-medium">
                      {member.name}
                    </span>
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

          {/* Right Column - Monsters */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-3 text-center">
              Enemies
            </h4>
            <div className="space-y-3">
              {gameState.monsters.map((monster) => (
                <div
                  key={monster.id}
                  className={`relative bg-black/40 backdrop-blur-sm border-2 rounded-lg transition-all duration-200 ${getRarityColor(
                    monster.rarity
                  )} ${
                    monster.health > 0
                      ? "hover:border-white/50"
                      : "border-gray-600 bg-gray-800/50"
                  } ${
                    clickedMonsters[monster.id]?.isPulsing
                      ? "animate-pulse-red"
                      : ""
                  }`}
                  onClick={(e) =>
                    monster.health > 0 && handleMonsterClick(monster.id, e)
                  }
                  onContextMenu={(e) =>
                    monster.health > 0 && handleMonsterRightClick(monster.id, e)
                  }
                  style={{ cursor: monster.health > 0 ? "pointer" : "default" }}
                >
                  {/* Fixed height container */}
                  <div className="h-48 flex">
                    {/* LEFT SIDE - Monster Image */}
                    <div className="w-1/2 relative flex items-center justify-center p-2">
                      <img
                        src={getMonsterImageWithFallback(monster.name)}
                        alt={monster.name}
                        className={`max-w-full max-h-full object-contain ${
                          monster.health <= 0 ? "grayscale opacity-50" : ""
                        }`}
                        onError={(e) => {
                          // Fallback to training dummy if image doesn't exist
                          (e.target as HTMLImageElement).src =
                            "/assets/training_dummy.png";
                        }}
                      />

                      {/* Rarity badge */}
                      <div className="absolute top-2 right-2">
                        {getRarityIcon(monster.rarity)}
                      </div>

                      {/* Damage number animation */}
                      {clickedMonsters[monster.id]?.damage > 0 && (
                        <div
                          className="absolute text-2xl font-bold text-red-500 animate-float-damage pointer-events-none"
                          style={{
                            left: clickedMonsters[monster.id].position.x,
                            top: clickedMonsters[monster.id].position.y,
                          }}
                        >
                          -{clickedMonsters[monster.id].damage}
                        </div>
                      )}
                    </div>

                    {/* RIGHT SIDE - Stats and Actions */}
                    <div className="w-1/2 flex flex-col p-2 justify-between">
                      {/* Top - Name and Type */}
                      <div>
                        <h4 className="text-base font-bold text-white mb-1 flex items-center gap-1">
                          {monster.name}
                          <span className="text-xs">
                            {getMonsterTypeIcon(monster.type)}
                          </span>
                        </h4>
                        <div className="text-xs text-gray-300 mb-1">
                          {monster.type} • {monster.rarity}
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          Speed: {(monster.attackInterval / 1000).toFixed(1)}s
                        </div>
                      </div>

                      {/* Middle - Health Bar */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="mb-1">
                          <div className="flex justify-between text-xs text-gray-300 mb-1">
                            <span>HP</span>
                            <span>
                              {monster.health}/{monster.maxHealth}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3 border border-gray-600">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                monster.health > monster.maxHealth * 0.5
                                  ? "bg-gradient-to-r from-green-400 to-green-500"
                                  : monster.health > monster.maxHealth * 0.25
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                  : "bg-gradient-to-r from-red-400 to-red-500"
                              }`}
                              style={{
                                width: `${
                                  (monster.health / monster.maxHealth) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-400 mt-1">
                          <div>ATK: {monster.attack}</div>
                          <div>DEF: {monster.defense}</div>
                        </div>
                      </div>

                      {/* Bottom - Compact Block/Parry Indicator */}
                      {monster.health > 0 &&
                        gameState.blockStates[monster.id]?.isVisible && (
                          <div className="h-6 flex items-end">
                            {(() => {
                              const timingState =
                                combatManager.current?.getBlockTimingState(
                                  monster.id
                                );
                              const isHolding =
                                gameState.blockStates[monster.id]?.isHolding;

                              return (
                                <div className="w-full">
                                  {/* Compact indicator with timing bar */}
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`px-2 py-1 rounded text-xs font-bold flex-1 ${
                                        isHolding
                                          ? "bg-blue-700 text-blue-200"
                                          : timingState?.isInParryWindow
                                          ? "bg-yellow-400 text-yellow-900 animate-pulse"
                                          : timingState?.isInBlockWindow
                                          ? "bg-green-500 text-white"
                                          : "bg-blue-500 text-white"
                                      }`}
                                    >
                                      {isHolding
                                        ? "🛡️ BLOCKING"
                                        : timingState?.isInParryWindow
                                        ? "⚡ PARRY"
                                        : timingState?.isInBlockWindow
                                        ? "🛡️ BLOCK"
                                        : "⚠️ INCOMING"}
                                    </div>

                                    {/* Compact timing bar */}
                                    <div className="w-16 bg-gray-700 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-100 ${
                                          timingState?.isInParryWindow
                                            ? "bg-yellow-400"
                                            : timingState?.isInBlockWindow
                                            ? "bg-green-400"
                                            : "bg-blue-400"
                                        }`}
                                        style={{
                                          width: `${
                                            (timingState?.progress || 0) * 100
                                          }%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Combat Instructions */}
      <div className="w-full max-w-4xl">
        <div className="flex gap-3 mb-4">
          {/* Combat Card */}
          <div className="flex-1 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sword className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-bold text-white">Combat</span>
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <div>• Click monsters to attack</div>
              <div>• Right-click to block</div>
              <div>• Watch for timing windows</div>
            </div>
          </div>

          {/* Blocking Card */}
          <div className="flex-1 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-bold text-white">Blocking</span>
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span>Warning - Block button appears</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>Block - Click to reduce damage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Parry - Click for perfect block!</span>
              </div>
            </div>
          </div>
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
