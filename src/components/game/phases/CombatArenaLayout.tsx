"use client";

import { useState, useEffect, useRef } from "react";
import { PhaseProgressIndicator } from "./PhaseProgressIndicator";
import { EnvironmentBackground } from "../EnvironmentBackground";
import { PhaseStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { PartyMemberCard } from "./PartyMemberCard";
import { MonsterCard } from "./MonsterCard";
import { api } from "@/trpc/react";
import {
  CombatStateManager,
  type CombatPartyMember,
  type EnhancedMonster,
  type DamageEvent,
} from "@/lib/combat/CombatStateManager";

interface Monster {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  type: string;
  rarity: string;
}

interface PartyMember {
  id: string;
  name: string;
  currentHealth: number;
  maxHealth: number;
  attack: number;
  defense: number;
  level: number;
  isDead: boolean;
  isNPC?: boolean;
  attackInterval?: number;
  nextAttackTime?: number;
}

interface CombatArenaLayoutProps {
  phaseNumber: number;
  totalPhases: number;
  phaseStatus: PhaseStatus;
  monsters: Monster[];
  partyMembers: PartyMember[];
  environmentType: string;
  remainingTime: number;
  sessionId: string;
  onPhaseComplete?: (result: any) => void;
}

export function CombatArenaLayout({
  phaseNumber,
  totalPhases,
  phaseStatus,
  monsters,
  partyMembers,
  environmentType,
  remainingTime,
  sessionId,
  onPhaseComplete,
}: CombatArenaLayoutProps) {
  // Combat state management
  const combatManager = useRef<CombatStateManager | null>(null);
  const [gameState, setGameState] = useState({
    monsters: [] as EnhancedMonster[],
    party: [] as CombatPartyMember[],
    blockStates: {} as Record<string, any>,
    damageLog: [] as DamageEvent[],
    gameActive: false,
    gameOver: false,
    timeTaken: 0,
    completionHandled: false,
    isInitializing: false,
    npcAttackStates: {} as Record<
      string,
      { isVisible: boolean; startTime?: number; duration?: number }
    >,
  });

  // Ref to track current game state for attack system
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Ref to track the attack interval to prevent multiple intervals
  const attackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to track attack times directly to avoid state update issues
  const attackTimesRef = useRef<Record<string, number>>({});

  // State for smooth timer updates
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [clickedMonsters, setClickedMonsters] = useState<Record<string, any>>(
    {}
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // tRPC mutations for server-side persistence
  const updateMonsterHealth = api.phase.updateMonsterHealth.useMutation();
  const updateCharacterHealth = api.character.updateHealth.useMutation();
  const updateNPCHealth = api.npc.updateHealth.useMutation();

  // Refs for timers
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const attackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scheduledAttacks = useRef<Set<string>>(new Set());
  const attackTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const blockStatesRef = useRef<Record<string, any>>({});

  // Calculate alive monsters and party members
  const aliveMonsters = gameState.monsters.filter((m) => m.health > 0);
  const alivePartyMembers = gameState.party.filter((m) => !m.isDead);

  // Initialize combat manager
  useEffect(() => {
    if (!combatManager.current) {
      combatManager.current = new CombatStateManager();
    }
  }, []);

  // Load saved combat state on mount
  useEffect(() => {
    loadCombatState();
  }, [phaseNumber]);

  // Save combat state whenever it changes
  useEffect(() => {
    if (gameState.gameActive && gameState.monsters.length > 0) {
      saveCombatState();
    }
  }, [
    gameState.monsters,
    gameState.party,
    gameState.damageLog,
    gameState.gameActive,
    gameState.gameOver,
  ]);

  // Initialize combat when monsters are available
  useEffect(() => {
    // Initialize combat if we have monsters and party members, and either:
    // 1. Game is not active yet, OR
    // 2. Game is active but we don't have monsters in combat state yet
    if (
      monsters.length > 0 &&
      partyMembers.length > 0 &&
      (!gameState.gameActive || gameState.monsters.length === 0) &&
      !gameState.isInitializing
    ) {
      setGameState((prev) => ({ ...prev, isInitializing: true }));
      initializeCombat();
    }
  }, [monsters, partyMembers, gameState.gameActive, gameState.monsters.length]);

  // NPC and Monster attack system
  useEffect(() => {
    if (!gameState.gameActive || gameState.gameOver || !combatManager.current) {
      // Clear any existing interval if game is not active
      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current);
        attackIntervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval before creating a new one
    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current);
      attackIntervalRef.current = null;
    }

    const checkAttacks = () => {
      const currentTime = Date.now();
      const currentState = gameStateRef.current;

      // Check NPC attacks
      currentState.party.forEach((member) => {
        if (member.isNPC && !member.isDead) {
          const nextAttackTime =
            attackTimesRef.current[member.id] || member.nextAttackTime;
          const timeUntilAttack = nextAttackTime
            ? nextAttackTime - currentTime
            : 0;
          if (nextAttackTime && currentTime >= nextAttackTime) {
            console.log(
              `⚔️ [CombatArenaLayout] NPC ${member.name} attacking (${member.attackInterval}s interval) - timeUntilAttack was ${timeUntilAttack}ms`
            );
            performNPCAttack(member);
          }
        }
      });

      // Check monster attacks
      currentState.monsters.forEach((monster) => {
        if (monster.health > 0) {
          const nextAttackTime =
            attackTimesRef.current[monster.id] || monster.nextAttackTime;
          const timeUntilAttack = nextAttackTime
            ? nextAttackTime - currentTime
            : 0;
          if (nextAttackTime && currentTime >= nextAttackTime) {
            console.log(
              `⚔️ [CombatArenaLayout] Monster ${monster.name} attacking (${monster.attackInterval}s interval) - timeUntilAttack was ${timeUntilAttack}ms`
            );
            performMonsterAttack(monster);
          }
        }
      });
    };

    // Set up attack checking interval
    attackIntervalRef.current = setInterval(checkAttacks, 100); // Check every 100ms

    return () => {
      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current);
        attackIntervalRef.current = null;
      }
    };
  }, [gameState.gameActive, gameState.gameOver]);

  // Smooth timer updates for progress bars
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 50); // Update every 50ms for smooth progress bars

    return () => clearInterval(timerInterval);
  }, []);

  // Cleanup effect to clear interval on unmount
  useEffect(() => {
    return () => {
      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current);
        attackIntervalRef.current = null;
      }
    };
  }, []);

  // Phase completion detection
  useEffect(() => {
    // Only check for completion if we have monsters in the combat state AND they're all defeated
    // AND we're not currently initializing
    if (
      gameState.gameActive &&
      !gameState.gameOver &&
      !gameState.completionHandled &&
      !gameState.isInitializing &&
      gameState.monsters.length > 0 && // We must have monsters in combat state
      aliveMonsters.length === 0 // And they must all be defeated
    ) {
      handlePhaseCompletion();
    }
  }, [
    aliveMonsters.length,
    gameState.gameActive,
    gameState.gameOver,
    gameState.completionHandled,
    gameState.isInitializing,
    gameState.monsters.length,
  ]);

  const initializeCombat = () => {
    if (!combatManager.current) return;

    // Convert monsters to EnhancedMonster format
    const enhancedMonsters: EnhancedMonster[] = monsters.map((monster) => ({
      id: monster.id,
      templateId: monster.id, // Use monster ID as template ID for now
      name: monster.name,
      type: monster.type as any,
      rarity: monster.rarity as any,
      health: monster.health,
      maxHealth: monster.maxHealth,
      attack: monster.attack,
      defense: monster.defense,
      attackInterval: 4, // Default 4 seconds
      nextAttackTime: Date.now() + 4000 + Math.random() * 2000, // Stagger attacks
    }));

    // Convert party members to CombatPartyMember format
    const combatParty: CombatPartyMember[] = partyMembers.map((member) => ({
      id: member.id,
      name: member.name,
      currentHealth: member.currentHealth,
      maxHealth: member.maxHealth,
      attack: member.attack,
      defense: member.defense,
      agility: member.attack, // Use attack as agility for now
      blockStrength: member.defense, // Use defense as block strength
      isDead: member.isDead,
      isNPC: member.isNPC,
      attackInterval: member.attackInterval, // Use the calculated attack interval from DungeonSessionContext
      nextAttackTime: member.nextAttackTime, // Use the calculated next attack time from DungeonSessionContext
    }));

    combatManager.current.initializeCombat(enhancedMonsters, combatParty);

    // Initialize attack times ref
    attackTimesRef.current = {};
    enhancedMonsters.forEach((monster) => {
      if (monster.nextAttackTime) {
        attackTimesRef.current[monster.id] = monster.nextAttackTime;
      }
    });
    combatParty.forEach((member) => {
      if (member.nextAttackTime) {
        attackTimesRef.current[member.id] = member.nextAttackTime;
      }
    });

    const initialState = combatManager.current.getState();

    setGameState((prev) => ({
      ...prev,
      monsters: initialState.monsters,
      party: initialState.party,
      blockStates: initialState.blockStates,
      damageLog: initialState.damageLog,
      gameActive: true,
      gameOver: false,
      timeTaken: 0,
      completionHandled: false,
      isInitializing: false,
    }));
  };

  // Combat interaction functions
  const handleMonsterClick = (monsterId: string, event: React.MouseEvent) => {
    if (!gameState.gameActive || gameState.gameOver || !combatManager.current) {
      return;
    }

    // Find the actual player character (not NPC) who should be attacking
    const currentPlayer = gameState.party.find((member) => !member.isNPC);
    if (!currentPlayer || currentPlayer.isDead) {
      return;
    }

    const targetMonster = gameState.monsters.find((m) => m.id === monsterId);
    if (!targetMonster) return;

    // Store monster health before attack for damage calculation
    const monsterHealthBefore = targetMonster.health;

    // Process attack
    const result = combatManager.current.processPartyAttack(
      currentPlayer.id,
      monsterId
    );

    // Calculate damage dealt
    const damageDealt = monsterHealthBefore - targetMonster.health;

    // Trigger click animation with damage number
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setClickedMonsters((prev) => ({
      ...prev,
      [monsterId]: {
        isPulsing: true,
        damage: result.damage,
        isCritical: result.isCritical,
        clickTime: Date.now(),
      },
    }));

    // Update state from combat manager while preserving attack times
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      monsters: newState.monsters.map((monster) => ({
        ...monster,
        nextAttackTime:
          prev.monsters.find((m) => m.id === monster.id)?.nextAttackTime ||
          monster.nextAttackTime,
      })),
      party: newState.party.map((member) => ({
        ...member,
        nextAttackTime:
          prev.party.find((m) => m.id === member.id)?.nextAttackTime ||
          member.nextAttackTime,
      })),
      blockStates: newState.blockStates,
      damageLog: newState.damageLog,
    }));

    // Persist monster health to database
    if (damageDealt > 0) {
      persistMonsterHealth(targetMonster.id, targetMonster.health);
    }

    // Clear animation after a short delay
    setTimeout(() => {
      setClickedMonsters((prev) => ({
        ...prev,
        [monsterId]: { ...prev[monsterId], isPulsing: false },
      }));
    }, 500);
  };

  const handleMonsterRightClick = (
    monsterId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    event.preventDefault();

    console.log(
      `🖱️ [CombatArenaLayout] Right-click detected on monster ${monsterId}`
    );

    if (!gameState.gameActive || gameState.gameOver || !combatManager.current) {
      console.log(
        `❌ [CombatArenaLayout] Right-click blocked: game not active or combat manager not ready`
      );
      return;
    }

    const monster = gameState.monsters.find((m) => m.id === monsterId);
    if (!monster || monster.health <= 0) {
      console.log(
        `❌ [CombatArenaLayout] Right-click blocked: monster not found or dead`
      );
      return;
    }

    // Check if we're in the block/parry window
    const now = Date.now();
    const timeUntilAttack = monster.nextAttackTime - now;

    console.log(
      `⏰ [CombatArenaLayout] Monster ${monster.name} timing: ${timeUntilAttack}ms until attack, rarity: ${monster.rarity}`
    );
    console.log(
      `⏰ [CombatArenaLayout] Monster nextAttackTime: ${new Date(
        monster.nextAttackTime
      ).toLocaleTimeString()}, current time: ${new Date(
        now
      ).toLocaleTimeString()}`
    );

    // Only allow blocking if attack is coming soon (within 2 seconds)
    if (timeUntilAttack <= 0 || timeUntilAttack > 2000) {
      console.log(
        `❌ [CombatArenaLayout] Right-click failed for ${monster.name}: ${timeUntilAttack}ms until attack (outside window)`
      );
      return; // Too early or too late to block
    }

    // Determine block/parry windows based on monster rarity
    let parryWindow = 300; // Base parry window (300ms)
    let blockWindow = 1000; // Base block window (1000ms)

    // Adjust windows based on monster rarity
    switch (monster.rarity) {
      case "BOSS":
        parryWindow = 200; // Harder to parry
        blockWindow = 800;
        break;
      case "RARE":
        parryWindow = 250;
        blockWindow = 900;
        break;
      case "ELITE":
        parryWindow = 300;
        blockWindow = 1000;
        break;
      case "COMMON":
      default:
        parryWindow = 400; // Easier to parry
        blockWindow = 1200;
        break;
    }

    let blockStatus: "none" | "block" | "parry" = "none";

    if (timeUntilAttack <= parryWindow && timeUntilAttack > 0) {
      blockStatus = "parry";
    } else if (timeUntilAttack <= blockWindow && timeUntilAttack > 0) {
      blockStatus = "block";
    }

    // Store the block status for when the attack happens
    if (blockStatus !== "none") {
      console.log(
        `🛡️ [CombatArenaLayout] Right-click block/parry set for ${monster.name}: ${blockStatus} (${timeUntilAttack}ms until attack)`
      );

      const blockState = {
        monsterId,
        isVisible: true,
        warningStartTime: now,
        attackTime: monster.nextAttackTime,
        isHolding: false,
        blockStatus: blockStatus,
      };

      // Store in ref for immediate access
      blockStatesRef.current[monsterId] = blockState;

      // Also set in React state for UI updates
      setGameState((prev) => ({
        ...prev,
        blockStates: {
          ...prev.blockStates,
          [monsterId]: blockState,
        },
      }));
    } else {
      console.log(
        `❌ [CombatArenaLayout] Right-click failed for ${monster.name}: ${timeUntilAttack}ms until attack (outside window)`
      );
    }
  };

  // NPC Attack System
  const performNPCAttack = (npc: CombatPartyMember) => {
    if (!combatManager.current) return;

    // Find a random alive monster to attack
    const aliveMonsters = gameState.monsters.filter((m) => m.health > 0);
    if (aliveMonsters.length === 0) return;

    const targetMonster =
      aliveMonsters[Math.floor(Math.random() * aliveMonsters.length)];

    // Store monster health before attack for damage calculation
    const monsterHealthBefore = targetMonster.health;

    // Process the attack
    const result = combatManager.current.processPartyAttack(
      npc.id,
      targetMonster.id
    );

    // Calculate damage dealt
    const damageDealt = monsterHealthBefore - targetMonster.health;

    // Update state while preserving attack times
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      monsters: newState.monsters.map((monster) => ({
        ...monster,
        nextAttackTime:
          prev.monsters.find((m) => m.id === monster.id)?.nextAttackTime ||
          monster.nextAttackTime,
      })),
      party: newState.party.map((member) => ({
        ...member,
        nextAttackTime:
          prev.party.find((m) => m.id === member.id)?.nextAttackTime ||
          member.nextAttackTime,
      })),
      blockStates: newState.blockStates,
      damageLog: newState.damageLog,
    }));

    // Persist monster health to database
    if (damageDealt > 0) {
      persistMonsterHealth(targetMonster.id, targetMonster.health);
    }

    // Set next attack time
    setNextNPCAttackTime(npc);
  };

  const setNextNPCAttackTime = (npc: CombatPartyMember) => {
    if (!npc.attackInterval) return;

    const nextAttackTime = Date.now() + npc.attackInterval * 1000;
    console.log(
      `🕐 [CombatArenaLayout] Setting next attack time for ${npc.name}: ${
        npc.attackInterval
      }s from now (${new Date(nextAttackTime).toLocaleTimeString()})`
    );

    // Update the ref immediately
    attackTimesRef.current[npc.id] = nextAttackTime;

    // Update the NPC's next attack time in the state
    setGameState((prev) => {
      const updatedParty = prev.party.map((member) =>
        member.id === npc.id ? { ...member, nextAttackTime } : member
      );
      console.log(
        `🔄 [CombatArenaLayout] Updated party member ${
          npc.name
        } nextAttackTime to ${new Date(nextAttackTime).toLocaleTimeString()}`
      );
      return {
        ...prev,
        party: updatedParty,
      };
    });
  };

  // Monster Attack System
  const performMonsterAttack = (monster: EnhancedMonster) => {
    console.log(
      `🚨 [CombatArenaLayout] performMonsterAttack called for ${monster.name}`
    );
    if (!combatManager.current) return;

    // Find a random alive party member to attack
    const alivePartyMembers = gameState.party.filter((m) => !m.isDead);
    if (alivePartyMembers.length === 0) return;

    const target =
      alivePartyMembers[Math.floor(Math.random() * alivePartyMembers.length)];

    // Store target health before attack for damage calculation
    const targetHealthBefore = target.currentHealth;

    // Check for stored block status (use ref for immediate access)
    const blockState =
      blockStatesRef.current[monster.id] || gameState.blockStates[monster.id];
    const blockStatus = blockState?.blockStatus || "none";

    console.log(
      `⚔️ [CombatArenaLayout] Monster ${monster.name} attacking ${target.name} with block status: ${blockStatus}`
    );
    console.log(`🔍 [CombatArenaLayout] Block state found:`, blockState);

    // Process the monster attack with block status
    combatManager.current.processMonsterAttack(
      monster.id,
      target.id,
      blockStatus
    );

    // Clear block state from both ref and React state after attack
    if (blockState) {
      // Clear from ref
      delete blockStatesRef.current[monster.id];

      // Clear from React state
      setGameState((prev) => {
        const newBlockStates = { ...prev.blockStates };
        delete newBlockStates[monster.id];
        return {
          ...prev,
          blockStates: newBlockStates,
        };
      });
    }

    // Calculate damage dealt
    const damageDealt = targetHealthBefore - target.currentHealth;

    // Update state while preserving attack times
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      monsters: newState.monsters.map((monster) => ({
        ...monster,
        nextAttackTime:
          prev.monsters.find((m) => m.id === monster.id)?.nextAttackTime ||
          monster.nextAttackTime,
      })),
      party: newState.party.map((member) => ({
        ...member,
        nextAttackTime:
          prev.party.find((m) => m.id === member.id)?.nextAttackTime ||
          member.nextAttackTime,
      })),
      blockStates: newState.blockStates,
      damageLog: newState.damageLog,
    }));

    // Persist party member health to database
    if (damageDealt > 0) {
      persistPartyMemberHealth(
        target.id,
        target.currentHealth,
        target.isNPC || false
      );
    }

    // Set next attack time for monster
    setNextMonsterAttackTime(monster);
  };

  const setNextMonsterAttackTime = (monster: EnhancedMonster) => {
    const nextAttackTime =
      Date.now() + monster.attackInterval * 1000 + Math.random() * 1000;
    console.log(
      `🕐 [CombatArenaLayout] Setting next attack time for ${monster.name}: ${
        monster.attackInterval
      }s from now (${new Date(nextAttackTime).toLocaleTimeString()})`
    );

    // Update the ref immediately
    attackTimesRef.current[monster.id] = nextAttackTime;

    // Update the monster's next attack time in the state
    setGameState((prev) => {
      const updatedMonsters = prev.monsters.map((m) =>
        m.id === monster.id ? { ...m, nextAttackTime } : m
      );
      console.log(
        `🔄 [CombatArenaLayout] Updated monster ${
          monster.name
        } nextAttackTime to ${new Date(nextAttackTime).toLocaleTimeString()}`
      );
      return {
        ...prev,
        monsters: updatedMonsters,
      };
    });
  };

  // Server-side persistence functions
  const persistMonsterHealth = async (monsterId: string, newHealth: number) => {
    try {
      await updateMonsterHealth.mutateAsync({
        sessionId: sessionId,
        phaseNumber: phaseNumber,
        monsterId: monsterId,
        newHealth: newHealth,
      });
    } catch (error) {
      console.error(
        `❌ [CombatArenaLayout] Failed to persist monster health:`,
        error
      );
    }
  };

  const persistPartyMemberHealth = async (
    memberId: string,
    newHealth: number,
    isNPC: boolean
  ) => {
    try {
      if (isNPC) {
        await updateNPCHealth.mutateAsync({
          npcId: memberId,
          newHealth: newHealth,
        });
      } else {
        await updateCharacterHealth.mutateAsync({
          characterId: memberId,
          newHealth: newHealth,
        });
      }
    } catch (error) {
      console.error(
        `❌ [CombatArenaLayout] Failed to persist party member health:`,
        error
      );
    }
  };

  // State Persistence Functions
  const saveCombatState = () => {
    if (!combatManager.current) return;

    const state = combatManager.current.getState();
    const combatData = {
      monsters: state.monsters,
      party: state.party,
      damageLog: state.damageLog,
      blockStates: state.blockStates,
      gameActive: gameState.gameActive,
      gameOver: gameState.gameOver,
      timeTaken: gameState.timeTaken,
      completionHandled: gameState.completionHandled,
      timestamp: Date.now(),
    };

    // Save to localStorage for persistence
    localStorage.setItem(
      `combat-state-${phaseNumber}`,
      JSON.stringify(combatData)
    );
  };

  const loadCombatState = () => {
    try {
      const savedState = localStorage.getItem(`combat-state-${phaseNumber}`);
      if (savedState) {
        const combatData = JSON.parse(savedState);

        // Restore the combat state
        setGameState((prev) => ({
          ...prev,
          monsters: combatData.monsters || [],
          party: combatData.party || [],
          damageLog: combatData.damageLog || [],
          blockStates: combatData.blockStates || {},
          gameActive: combatData.gameActive || false,
          gameOver: combatData.gameOver || false,
          timeTaken: combatData.timeTaken || 0,
          completionHandled: combatData.completionHandled || false,
        }));

        // Restore combat manager state
        if (combatManager.current && combatData.monsters && combatData.party) {
          combatManager.current.restoreState(combatData);
        }

        return true;
      }
    } catch (error) {
      console.error(
        "❌ [CombatArenaLayout] Error loading combat state:",
        error
      );
    }
    return false;
  };

  // Phase Completion Handler
  const handlePhaseCompletion = () => {
    if (gameState.completionHandled) return;

    setGameState((prev) => ({
      ...prev,
      gameOver: true,
      completionHandled: true,
    }));

    // Clear saved state on completion
    localStorage.removeItem(`combat-state-${phaseNumber}`);

    // Call the completion callback
    if (onPhaseComplete) {
      const result = {
        victory: true,
        timeTaken: gameState.timeTaken,
        monstersDefeated: monsters.length,
        damageDealt: 0, // TODO: Calculate total damage dealt
        damageTaken: 0, // TODO: Calculate total damage taken
      };
      onPhaseComplete(result);
    }
  };

  return (
    <div className="flex h-full w-full relative overflow-x-hidden">
      <EnvironmentBackground environmentType={environmentType} />

      {/* Main Combat Area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-x-hidden">
        {/* Phase Progress */}
        <div className="p-4">
          <PhaseProgressIndicator
            currentPhase={phaseNumber}
            totalPhases={totalPhases}
            phaseStatus={phaseStatus}
          />
        </div>

        {/* Combat Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-x-hidden">
          {/* Monsters Display */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              {aliveMonsters.length > 0 ? "Enemies" : "All Enemies Defeated!"}
            </h2>

            {aliveMonsters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                {aliveMonsters.map((monster) => (
                  <MonsterCard
                    key={monster.id}
                    monster={monster}
                    currentTime={currentTime}
                    onClick={handleMonsterClick}
                    onRightClick={handleMonsterRightClick}
                    isClickable={monster.health > 0}
                    blockState={gameState.blockStates[monster.id]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-xl text-green-400 font-semibold">
                  Phase {phaseNumber} Complete!
                </p>
              </div>
            )}
          </div>

          {/* Party Members Display */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              Party Members
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {alivePartyMembers.map((member) => (
                <PartyMemberCard
                  key={member.id}
                  member={member}
                  currentTime={currentTime}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Party Status Sidebar */}
      <div className="flex">
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-black/20 backdrop-blur-sm border-l border-white/10 px-2 py-4 flex items-center justify-center hover:bg-black/30 transition-colors z-10"
        >
          {sidebarOpen ? (
            <ChevronRight className="h-4 w-4 text-white" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-white" />
          )}
        </button>

        {/* Sidebar Content */}
        {sidebarOpen && (
          <div className="w-80 z-10 bg-black/20 backdrop-blur-sm border-l border-white/10 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Party Status
            </h3>

            {/* Combat Stats */}
            <div className="mt-6 p-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">
                Combat Info
              </h4>
              <div className="space-y-1 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Alive Members:</span>
                  <span className="text-green-400">
                    {alivePartyMembers.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Enemies Remaining:</span>
                  <span className="text-red-400">{aliveMonsters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phase:</span>
                  <span className="text-blue-400">
                    {phaseNumber}/{totalPhases}
                  </span>
                </div>
              </div>
            </div>

            {/* Combat Log */}
            <div className="mt-4 p-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">
                Combat Log
              </h4>
              <div className="space-y-1 text-xs text-gray-300 max-h-32 overflow-y-auto">
                {gameState.damageLog.slice(-10).map((event, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={
                        event.type === "damage_dealt"
                          ? "text-red-400"
                          : event.type === "damage_taken"
                          ? "text-orange-400"
                          : event.type === "heal"
                          ? "text-green-400"
                          : event.type === "block"
                          ? "text-blue-400"
                          : event.type === "parry"
                          ? "text-purple-400"
                          : "text-gray-400"
                      }
                    >
                      {event.source}{" "}
                      {event.type === "damage_dealt"
                        ? "attacks"
                        : event.type === "damage_taken"
                        ? "takes damage from"
                        : event.type === "heal"
                        ? "heals"
                        : event.type === "block"
                        ? "blocks"
                        : event.type === "parry"
                        ? "parries"
                        : "affects"}{" "}
                      {event.target} for {Math.abs(event.amount)}{" "}
                      {event.type === "damage_dealt" ||
                      event.type === "damage_taken"
                        ? "damage"
                        : "health"}
                      {event.isCritical && " 💥"}
                    </span>
                  </div>
                ))}
                {gameState.damageLog.length === 0 && (
                  <div className="text-gray-500 text-center">
                    No combat activity yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
