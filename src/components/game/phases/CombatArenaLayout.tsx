"use client";

import { useState, useEffect, useRef } from "react";
import { PhaseProgressIndicator } from "./PhaseProgressIndicator";
import { EnvironmentBackground } from "../EnvironmentBackground";
import { PhaseStatus } from "@prisma/client";
import { Heart, Sword, Shield, Zap, Star, Crown } from "@/components/icons";
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
  const [clickedMonsters, setClickedMonsters] = useState<Record<string, any>>(
    {}
  );

  // tRPC mutations for server-side persistence
  const updateMonsterHealth = api.phase.updateMonsterHealth.useMutation();
  const updateCharacterHealth = api.character.updateHealth.useMutation();
  const updateNPCHealth = api.npc.updateHealth.useMutation();

  // Refs for timers
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const attackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scheduledAttacks = useRef<Set<string>>(new Set());
  const attackTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
      return;
    }

    const checkAttacks = () => {
      const currentTime = Date.now();
      const newState = { ...gameState };

      // Check NPC attacks
      gameState.party.forEach((member) => {
        if (
          member.isNPC &&
          !member.isDead &&
          member.nextAttackTime &&
          currentTime >= member.nextAttackTime
        ) {
          performNPCAttack(member);
        }
      });

      // Check monster attacks
      gameState.monsters.forEach((monster) => {
        if (
          monster.health > 0 &&
          monster.nextAttackTime &&
          currentTime >= monster.nextAttackTime
        ) {
          performMonsterAttack(monster);
        }
      });
    };

    // Set up attack checking interval
    const attackInterval = setInterval(checkAttacks, 100); // Check every 100ms

    return () => {
      clearInterval(attackInterval);
    };
  }, [gameState.gameActive, gameState.gameOver]);

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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "LEGENDARY":
        return "text-purple-400";
      case "RARE":
        return "text-blue-400";
      case "UNCOMMON":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  const getHealthPercentage = (current: number, max: number) => {
    return Math.max(0, Math.min(100, (current / max) * 100));
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

    // Update state from combat manager
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      monsters: newState.monsters,
      party: newState.party,
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

  const getMonsterImageWithFallback = (monsterName: string): string => {
    // For now, always use training dummy since we don't have monster images yet
    return "/assets/training_dummy.png";
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "BOSS":
        return <Crown className="h-4 w-4 text-yellow-400" />;
      case "RARE":
        return <Star className="h-4 w-4 text-blue-400" />;
      case "ELITE":
        return <Zap className="h-4 w-4 text-purple-400" />;
      default:
        return null;
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

    // Update state
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      monsters: newState.monsters,
      party: newState.party,
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

    // Update the NPC's next attack time in the state
    setGameState((prev) => ({
      ...prev,
      party: prev.party.map((member) =>
        member.id === npc.id ? { ...member, nextAttackTime } : member
      ),
    }));
  };

  // Monster Attack System
  const performMonsterAttack = (monster: EnhancedMonster) => {
    if (!combatManager.current) return;

    // Find a random alive party member to attack
    const alivePartyMembers = gameState.party.filter((m) => !m.isDead);
    if (alivePartyMembers.length === 0) return;

    const target =
      alivePartyMembers[Math.floor(Math.random() * alivePartyMembers.length)];

    // Store target health before attack for damage calculation
    const targetHealthBefore = target.currentHealth;

    // Process the monster attack
    combatManager.current.processMonsterAttack(monster.id, target.id);

    // Calculate damage dealt
    const damageDealt = targetHealthBefore - target.currentHealth;

    // Update state
    const newState = combatManager.current.getState();
    setGameState((prev) => ({
      ...prev,
      monsters: newState.monsters,
      party: newState.party,
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

    // Update the monster's next attack time in the state
    setGameState((prev) => ({
      ...prev,
      monsters: prev.monsters.map((m) =>
        m.id === monster.id ? { ...m, nextAttackTime } : m
      ),
    }));
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
    <div className="flex h-full w-full relative">
      <EnvironmentBackground environmentType={environmentType} />

      {/* Main Combat Area */}
      <div className="flex-1 flex flex-col relative z-10 w-full">
        {/* Phase Progress */}
        <div className="p-4">
          <PhaseProgressIndicator
            currentPhase={phaseNumber}
            totalPhases={totalPhases}
            phaseStatus={phaseStatus}
          />
        </div>

        {/* Combat Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Monsters Display */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              {aliveMonsters.length > 0 ? "Enemies" : "All Enemies Defeated!"}
            </h2>

            {aliveMonsters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                {aliveMonsters.map((monster) => (
                  <div
                    key={monster.id}
                    className={`relative bg-black/40 backdrop-blur-sm border-2 rounded-lg transition-all duration-200 ${getRarityColor(
                      monster.rarity
                    )} ${
                      monster.health > 0
                        ? "hover:border-white/50 cursor-pointer"
                        : "border-gray-600 bg-gray-800/50"
                    } ${
                      clickedMonsters[monster.id]?.isPulsing
                        ? "animate-pulse-red"
                        : ""
                    }`}
                    onClick={(e) =>
                      monster.health > 0 && handleMonsterClick(monster.id, e)
                    }
                    style={{
                      cursor: monster.health > 0 ? "pointer" : "default",
                    }}
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

                        {/* Attack timer for monsters */}
                        {monster.health > 0 && monster.nextAttackTime && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="w-full bg-gray-600 rounded-full h-1 mb-1">
                              <div
                                className="bg-red-500 h-1 rounded-full transition-all duration-100"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      ((monster.nextAttackTime - Date.now()) /
                                        (monster.attackInterval * 1000)) *
                                        100
                                    )
                                  )}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-red-400 text-center">
                              {Math.max(
                                0,
                                Math.ceil(
                                  (monster.nextAttackTime - Date.now()) / 1000
                                )
                              )}
                              s
                            </p>
                          </div>
                        )}

                        {/* Damage number animation */}
                        {clickedMonsters[monster.id]?.damage > 0 && (
                          <div
                            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold pointer-events-none animate-bounce ${
                              clickedMonsters[monster.id]?.isCritical
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                            style={{
                              animationDelay: "0ms",
                              animationDuration: "500ms",
                            }}
                          >
                            {clickedMonsters[monster.id]?.isCritical
                              ? "💥"
                              : ""}
                            {clickedMonsters[monster.id]?.damage}
                          </div>
                        )}
                      </div>

                      {/* RIGHT SIDE - Monster Info */}
                      <div className="w-1/2 flex flex-col justify-between p-3">
                        {/* Top - Name and Type */}
                        <div>
                          <h3
                            className={`text-lg font-semibold ${getRarityColor(
                              monster.rarity
                            )}`}
                          >
                            {monster.name}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">
                            {monster.type} • Level{" "}
                            {Math.floor(monster.attack / 5)}
                          </p>
                        </div>

                        {/* Middle - Health Bar */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${
                                monster.health / monster.maxHealth > 0.5
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
                          <p className="text-xs text-gray-300 text-center">
                            {monster.health} / {monster.maxHealth} HP
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-400 mt-1">
                          <div>ATK: {monster.attack}</div>
                          <div>DEF: {monster.defense}</div>
                        </div>
                      </div>

                      {/* Block/Parry Indicator */}
                      {monster.health > 0 &&
                        gameState.blockStates[monster.id]?.isVisible && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded text-center font-bold">
                              🛡️ BLOCK NOW!
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
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
                <div
                  key={member.id}
                  className={`relative bg-black/40 backdrop-blur-sm border-2 rounded-lg transition-all duration-200 ${
                    member.isDead
                      ? "border-red-500/50 bg-red-900/20"
                      : "border-green-500/50 hover:border-green-400/70"
                  }`}
                >
                  {/* Fixed height container */}
                  <div className="h-48 flex">
                    {/* LEFT SIDE - Character Avatar/Image */}
                    <div className="w-1/2 relative flex items-center justify-center p-2">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {member.name.charAt(0)}
                      </div>

                      {/* NPC badge */}
                      {member.isNPC && (
                        <div className="absolute top-2 right-2">
                          <span className="px-1.5 py-0.5 bg-blue-600 text-blue-100 text-xs rounded font-bold">
                            NPC
                          </span>
                        </div>
                      )}

                      {/* Attack timer for NPCs */}
                      {member.isNPC && member.attackInterval && (
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="w-full bg-gray-600 rounded-full h-1 mb-1">
                            <div
                              className="bg-orange-500 h-1 rounded-full transition-all duration-100"
                              style={{
                                width: member.nextAttackTime
                                  ? `${Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        ((member.nextAttackTime - Date.now()) /
                                          (member.attackInterval * 1000)) *
                                          100
                                      )
                                    )}%`
                                  : "0%",
                              }}
                            />
                          </div>
                          <p className="text-xs text-orange-400 text-center">
                            {member.nextAttackTime
                              ? Math.max(
                                  0,
                                  Math.ceil(
                                    (member.nextAttackTime - Date.now()) / 1000
                                  )
                                )
                              : 0}
                            s
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RIGHT SIDE - Character Info */}
                    <div className="w-1/2 flex flex-col justify-between p-3">
                      {/* Top - Name and Level */}
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {member.name}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          Level {member.level}
                        </p>
                      </div>

                      {/* Middle - Health Bar */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              member.isDead
                                ? "bg-red-500"
                                : member.currentHealth / member.maxHealth > 0.5
                                ? "bg-gradient-to-r from-green-400 to-green-500"
                                : "bg-gradient-to-r from-yellow-400 to-red-500"
                            }`}
                            style={{
                              width: `${getHealthPercentage(
                                member.currentHealth,
                                member.maxHealth
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-300 text-center">
                          {member.currentHealth} / {member.maxHealth} HP
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-400 mt-1">
                        <div>ATK: {member.attack}</div>
                        <div>DEF: {member.defense}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Party Status Sidebar */}
      <div className="w-80 bg-black/20 backdrop-blur-sm border-l border-white/10 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Party Status</h3>

        <div className="space-y-3">
          {alivePartyMembers.map((member) => (
            <div
              key={member.id}
              className={`bg-black/30 backdrop-blur-sm border rounded-lg p-3 ${
                member.isDead ? "border-red-500/50" : "border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-white">
                    {member.name}
                  </span>
                  {member.isNPC && (
                    <span className="px-1.5 py-0.5 bg-blue-600 text-blue-100 text-xs rounded">
                      NPC
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">Lv.{member.level}</span>
              </div>

              {/* Health Bar */}
              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    member.isDead ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{
                    width: `${getHealthPercentage(
                      member.currentHealth,
                      member.maxHealth
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-300">
                {member.currentHealth} / {member.maxHealth} HP
              </p>

              {/* NPC Attack Timer */}
              {member.isNPC && member.attackInterval && (
                <div className="mt-2">
                  <div className="w-full bg-gray-600 rounded-full h-1">
                    <div
                      className="bg-orange-500 h-1 rounded-full transition-all duration-100"
                      style={{
                        width: member.nextAttackTime
                          ? `${Math.max(
                              0,
                              Math.min(
                                100,
                                ((member.nextAttackTime - Date.now()) /
                                  (member.attackInterval * 1000)) *
                                  100
                              )
                            )}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-orange-400 mt-1">
                    Next Attack:{" "}
                    {member.nextAttackTime
                      ? Math.max(
                          0,
                          Math.ceil((member.nextAttackTime - Date.now()) / 1000)
                        )
                      : 0}
                    s
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Combat Stats */}
        <div className="mt-6 p-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">Combat Info</h4>
          <div className="space-y-1 text-xs text-gray-300">
            <div className="flex justify-between">
              <span>Alive Members:</span>
              <span className="text-green-400">{alivePartyMembers.length}</span>
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
          <h4 className="text-sm font-semibold text-white mb-2">Combat Log</h4>
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
    </div>
  );
}
