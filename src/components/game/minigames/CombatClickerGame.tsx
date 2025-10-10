"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Sword, Shield, Zap } from "@/components/icons";

interface CombatClickerGameProps {
  config: {
    monsterCount: number;
    monsterHealth: number; // per monster
    monsterAttack: number;
    attackInterval: number; // seconds
    monsterName: string;
  };
  playerStats: {
    attack: number;
    defense: number;
    health: number;
    maxHealth: number;
  };
  partyMembers: Array<{
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
  }>;
  onComplete: (result: {
    victory: boolean;
    timeTaken: number;
    totalClicks: number;
    damageDealt: number;
    damageTaken: Record<string, number>;
    playersRevived: number;
    contributionByPlayer: Record<string, number>;
  }) => void;
}

interface Monster {
  id: string;
  health: number;
  maxHealth: number;
  name: string;
}

interface PartyMember {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  isKnockedOut: boolean;
  reviveProgress: number;
  reviveNeeded: number;
}

export function CombatClickerGame({
  config,
  playerStats,
  partyMembers,
  onComplete,
}: CombatClickerGameProps) {
  const [gameState, setGameState] = useState<{
    monsters: Monster[];
    party: PartyMember[];
    gameActive: boolean;
    gameOver: boolean;
    victory: boolean;
    timeStarted: number;
    timeTaken: number;
    totalClicks: number;
    damageDealt: number;
    damageTaken: Record<string, number>;
    playersRevived: number;
    contributionByPlayer: Record<string, number>;
    nextAttackTime: number;
  }>({
    monsters: [],
    party: [],
    gameActive: false,
    gameOver: false,
    victory: false,
    timeStarted: 0,
    timeTaken: 0,
    totalClicks: 0,
    damageDealt: 0,
    damageTaken: {},
    playersRevived: 0,
    contributionByPlayer: {},
    nextAttackTime: 0,
  });

  const attackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game state
  useEffect(() => {
    const monsters: Monster[] = [];
    for (let i = 0; i < config.monsterCount; i++) {
      monsters.push({
        id: `monster-${i}`,
        health: config.monsterHealth,
        maxHealth: config.monsterHealth,
        name: config.monsterName,
      });
    }

    const party: PartyMember[] = partyMembers.map((member) => ({
      ...member,
      isKnockedOut: false,
      reviveProgress: 0,
      reviveNeeded: 3 + Math.floor(Math.random() * 3), // 3-5 clicks to revive
    }));

    setGameState((prev) => ({
      ...prev,
      monsters,
      party,
      gameActive: true,
      timeStarted: Date.now(),
      nextAttackTime: Date.now() + config.attackInterval * 1000,
    }));
  }, [config, partyMembers]);

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
    if (!gameState.gameActive || gameState.gameOver) return;

    const checkAttack = () => {
      const now = Date.now();
      if (now >= gameState.nextAttackTime) {
        performMonsterAttack();
        setGameState((prev) => ({
          ...prev,
          nextAttackTime: now + config.attackInterval * 1000,
        }));
      }
    };

    attackTimerRef.current = setInterval(checkAttack, 100);

    return () => {
      if (attackTimerRef.current) {
        clearInterval(attackTimerRef.current);
      }
    };
  }, [
    gameState.gameActive,
    gameState.gameOver,
    gameState.nextAttackTime,
    config.attackInterval,
  ]);

  const performMonsterAttack = () => {
    setGameState((prev) => {
      const aliveMembers = prev.party.filter((member) => !member.isKnockedOut);
      if (aliveMembers.length === 0) return prev;

      const target =
        aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
      const damage = Math.max(1, config.monsterAttack - target.defense);
      const newHealth = Math.max(0, target.health - damage);

      const updatedParty = prev.party.map((member) =>
        member.id === target.id
          ? {
              ...member,
              health: newHealth,
              isKnockedOut: newHealth === 0,
            }
          : member
      );

      const newDamageTaken = {
        ...prev.damageTaken,
        [target.id]: (prev.damageTaken[target.id] || 0) + damage,
      };

      return {
        ...prev,
        party: updatedParty,
        damageTaken: newDamageTaken,
      };
    });
  };

  const handleMonsterClick = (monsterId: string) => {
    if (!gameState.gameActive || gameState.gameOver) return;

    setGameState((prev) => {
      const monster = prev.monsters.find((m) => m.id === monsterId);
      if (!monster) return prev;

      // Calculate damage based on player stats
      const baseDamage = playerStats.attack;
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier
      const damage = Math.max(1, Math.floor(baseDamage * randomFactor));

      const newHealth = Math.max(0, monster.health - damage);
      const updatedMonsters = prev.monsters.map((m) =>
        m.id === monsterId ? { ...m, health: newHealth } : m
      );

      const newContributionByPlayer = {
        ...prev.contributionByPlayer,
        [playerStats.attack]:
          (prev.contributionByPlayer[playerStats.attack] || 0) + damage,
      };

      return {
        ...prev,
        monsters: updatedMonsters,
        totalClicks: prev.totalClicks + 1,
        damageDealt: prev.damageDealt + damage,
        contributionByPlayer: newContributionByPlayer,
      };
    });
  };

  const handleReviveClick = (memberId: string) => {
    if (!gameState.gameActive || gameState.gameOver) return;

    setGameState((prev) => {
      const member = prev.party.find((m) => m.id === memberId);
      if (!member || !member.isKnockedOut) return prev;

      const newReviveProgress = member.reviveProgress + 1;
      const isRevived = newReviveProgress >= member.reviveNeeded;

      const updatedParty = prev.party.map((m) =>
        m.id === memberId
          ? {
              ...m,
              reviveProgress: newReviveProgress,
              isKnockedOut: !isRevived,
              health: isRevived ? Math.floor(m.maxHealth * 0.5) : m.health, // Revive with 50% health
            }
          : m
      );

      return {
        ...prev,
        party: updatedParty,
        playersRevived: isRevived
          ? prev.playersRevived + 1
          : prev.playersRevived,
      };
    });
  };

  // Check win/lose conditions
  useEffect(() => {
    if (!gameState.gameActive || gameState.gameOver) return;

    const aliveMembers = gameState.party.filter(
      (member) => !member.isKnockedOut
    );
    const aliveMonsters = gameState.monsters.filter(
      (monster) => monster.health > 0
    );

    if (aliveMonsters.length === 0) {
      // Victory
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        victory: true,
        gameActive: false,
      }));
    } else if (aliveMembers.length === 0) {
      // Defeat
      setGameState((prev) => ({
        ...prev,
        gameOver: true,
        victory: false,
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
    if (gameState.gameOver) {
      const finalTime = Date.now() - gameState.timeStarted;
      onComplete({
        victory: gameState.victory,
        timeTaken: finalTime,
        totalClicks: gameState.totalClicks,
        damageDealt: gameState.damageDealt,
        damageTaken: gameState.damageTaken,
        playersRevived: gameState.playersRevived,
        contributionByPlayer: gameState.contributionByPlayer,
      });
    }
  }, [
    gameState.gameOver,
    gameState.victory,
    gameState.timeTaken,
    gameState.totalClicks,
    gameState.damageDealt,
    gameState.damageTaken,
    gameState.playersRevived,
    gameState.contributionByPlayer,
    onComplete,
  ]);

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

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Game Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Combat Challenge</h3>
        <p className="text-gray-400 text-sm mb-4">
          Click monsters to attack! They'll fight back every{" "}
          {config.attackInterval} seconds.
        </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {gameState.monsters.map((monster) => (
          <div
            key={monster.id}
            className={`relative bg-red-900/50 border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              monster.health > 0
                ? "border-red-500 hover:border-red-400 hover:bg-red-900/70"
                : "border-gray-600 bg-gray-800/50 cursor-not-allowed"
            }`}
            onClick={() => monster.health > 0 && handleMonsterClick(monster.id)}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">👹</div>
              <h4 className="text-lg font-semibold text-white mb-2">
                {monster.name}
              </h4>
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
              <p className="text-sm text-gray-300">
                {monster.health}/{monster.maxHealth} HP
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Party Status */}
      <div className="w-full max-w-2xl">
        <h4 className="text-lg font-semibold text-white mb-3 text-center">
          Party Status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gameState.party.map((member) => (
            <div
              key={member.id}
              className={`bg-gray-800/50 border-2 rounded-lg p-3 ${
                member.isKnockedOut
                  ? "border-red-500 bg-red-900/20"
                  : "border-gray-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{member.name}</span>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-gray-300">
                    {member.health}/{member.maxHealth}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    member.health > member.maxHealth * 0.5
                      ? "bg-green-500"
                      : member.health > member.maxHealth * 0.25
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${(member.health / member.maxHealth) * 100}%`,
                  }}
                />
              </div>
              {member.isKnockedOut && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-red-400">
                      Revive Progress
                    </span>
                    <span className="text-xs text-gray-400">
                      {member.reviveProgress}/{member.reviveNeeded}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div
                      className="h-1 rounded-full bg-blue-500 transition-all duration-200"
                      style={{
                        width: `${
                          (member.reviveProgress / member.reviveNeeded) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleReviveClick(member.id)}
                    className="w-full mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Click to Revive
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
              <p>Total Clicks: {gameState.totalClicks}</p>
              <p>Damage Dealt: {gameState.damageDealt}</p>
              <p>Players Revived: {gameState.playersRevived}</p>
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
