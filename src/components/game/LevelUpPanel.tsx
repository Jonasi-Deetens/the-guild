"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  Star,
  Heart,
  Sword,
  Shield,
  Zap,
  Eye,
  Crown,
  AlertTriangle,
  CheckCircle,
} from "@/components/icons";
import { api } from "@/trpc/react";
import {
  getStatPointsPerLevel,
  validateStatAllocations,
  getExperienceInfo,
} from "@/lib/utils/experience";
import { ParticleEffect } from "./ParticleEffect";

interface LevelUpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatAllocation {
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  perception: number;
  agility: number;
  criticalChance: number;
  blockStrength: number;
}

export function LevelUpPanel({ isOpen, onClose }: LevelUpPanelProps) {
  const [statAllocations, setStatAllocations] = useState<StatAllocation>({
    maxHealth: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    perception: 0,
    agility: 0,
    criticalChance: 0,
    blockStrength: 0,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [levelUpResult, setLevelUpResult] = useState<any>(null);

  // tRPC queries and mutations
  const utils = api.useUtils();
  const { data: canLevelUpData, refetch: refetchCanLevelUp } =
    api.character.canLevelUp.useQuery();
  const { data: character, refetch: refetchCharacter } =
    api.character.getCurrent.useQuery();
  const levelUpMutation = api.character.levelUp.useMutation();

  const availablePoints = canLevelUpData?.pendingStatPoints || 0;
  const pendingLevels = canLevelUpData?.pendingLevels || 0;
  const isMaxLevel = canLevelUpData?.isMaxLevel || false;

  // Calculate experience info for progress display
  const experienceInfo = character
    ? getExperienceInfo(character.level, character.experience)
    : null;

  // Reset allocations when panel opens
  useEffect(() => {
    if (isOpen) {
      setStatAllocations({
        maxHealth: 0,
        attack: 0,
        defense: 0,
        speed: 0,
        perception: 0,
        agility: 0,
        criticalChance: 0,
        blockStrength: 0,
      });
      setShowSuccess(false);
      setLevelUpResult(null);
    }
  }, [isOpen]);

  const handleStatChange = (stat: keyof StatAllocation, value: number) => {
    const newAllocations = { ...statAllocations, [stat]: value };
    setStatAllocations(newAllocations);
  };

  const handleLevelUp = async () => {
    if (!canLevelUpData?.canLevelUp) return;

    try {
      const result = await levelUpMutation.mutateAsync({
        statAllocations,
      });

      setLevelUpResult(result);
      setShowSuccess(true);

      // Invalidate and refetch all character-related queries
      await utils.character.getCurrent.invalidate();
      await utils.character.canLevelUp.invalidate();

      // Also refetch to ensure immediate update
      await refetchCharacter();
      await refetchCanLevelUp();

      // Auto-close after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Failed to level up:", error);
    }
  };

  const totalAllocated = Object.values(statAllocations).reduce(
    (sum, value) => sum + value,
    0
  );

  const validation = validateStatAllocations(statAllocations);
  const canConfirm = validation.isValid && totalAllocated === availablePoints;

  if (!isOpen) return null;

  if (showSuccess && levelUpResult) {
    return (
      <Modal isOpen={true} onClose={onClose} title="">
        <div className="p-8 text-center relative">
          <ParticleEffect
            isActive={showSuccess}
            type="levelUp"
            duration={3000}
            particleCount={80}
            className="z-10"
          />
          <div className="relative z-20">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">
              Level Up Complete!
            </h2>
            <div className="text-xl text-white mb-6">
              You are now Level {levelUpResult.character.level}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Stat Increases
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(levelUpResult.statIncreases).map(
                ([stat, value]) => {
                  if (value === 0) return null;
                  const statIcons: Record<string, any> = {
                    maxHealth: <Heart className="h-4 w-4 text-red-400" />,
                    attack: <Sword className="h-4 w-4 text-orange-400" />,
                    defense: <Shield className="h-4 w-4 text-blue-400" />,
                    speed: <Zap className="h-4 w-4 text-yellow-400" />,
                    perception: <Eye className="h-4 w-4 text-purple-400" />,
                    agility: <Zap className="h-4 w-4 text-cyan-400" />,
                    criticalChance: <Star className="h-4 w-4 text-pink-400" />,
                    blockStrength: (
                      <Shield className="h-4 w-4 text-indigo-400" />
                    ),
                  };

                  return (
                    <div key={stat} className="flex items-center space-x-2">
                      {statIcons[stat]}
                      <span className="text-gray-300 capitalize">
                        {stat.replace(/([A-Z])/g, " $1").trim()}:
                      </span>
                      <span className="text-green-400 font-semibold">
                        +{value}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Level Up">
      <div className="p-6">
        {isMaxLevel ? (
          <div className="text-center py-8">
            <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Maximum Level Reached!
            </h3>
            <p className="text-gray-400">
              You have reached the maximum level of 20. Congratulations!
            </p>
          </div>
        ) : !canLevelUpData?.canLevelUp ? (
          <div className="text-center py-8">
            <Star className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Current Progress
            </h3>
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Current Level:</span>
                  <span className="text-white font-semibold">
                    {character?.level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Experience:</span>
                  <span className="text-yellow-400 font-semibold">
                    {character?.experience?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Next Level:</span>
                  <span className="text-blue-400 font-semibold">
                    Level {character ? character.level + 1 : "?"}
                  </span>
                </div>
              </div>

              {/* Experience Progress Bar */}
              {experienceInfo && !experienceInfo.isMaxLevel && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      Progress to Level {experienceInfo.currentLevel + 1}:
                    </span>
                    <span className="text-yellow-400 font-semibold">
                      {experienceInfo.experienceProgress}/
                      {experienceInfo.experienceNeeded}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${experienceInfo.progressPercentage}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    {experienceInfo.experienceToNext} XP needed
                  </div>
                </div>
              )}
            </div>
            <p className="text-gray-400">
              Continue gaining experience to level up!
            </p>
          </div>
        ) : (
          <>
            {/* Level Up Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">
                  Level Up Available
                </h3>
                <span className="text-yellow-400 font-bold">
                  +{pendingLevels} Level{pendingLevels > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                You have {availablePoints} stat points to allocate.
              </p>
            </div>

            {/* Stat Allocation */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">
                Allocate Stat Points
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Max Health */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-gray-300">Max Health</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "maxHealth",
                          Math.max(0, statAllocations.maxHealth - 1)
                        )
                      }
                      disabled={statAllocations.maxHealth <= 0}
                    >
                      -
                    </Button>
                    <span className="text-white font-semibold w-8 text-center">
                      {statAllocations.maxHealth}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "maxHealth",
                          statAllocations.maxHealth + 1
                        )
                      }
                      disabled={totalAllocated >= availablePoints}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Attack */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Sword className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-gray-300">Attack</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "attack",
                          Math.max(0, statAllocations.attack - 1)
                        )
                      }
                      disabled={statAllocations.attack <= 0}
                    >
                      -
                    </Button>
                    <span className="text-white font-semibold w-8 text-center">
                      {statAllocations.attack}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange("attack", statAllocations.attack + 1)
                      }
                      disabled={totalAllocated >= availablePoints}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Defense */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Defense</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "defense",
                          Math.max(0, statAllocations.defense - 1)
                        )
                      }
                      disabled={statAllocations.defense <= 0}
                    >
                      -
                    </Button>
                    <span className="text-white font-semibold w-8 text-center">
                      {statAllocations.defense}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange("defense", statAllocations.defense + 1)
                      }
                      disabled={totalAllocated >= availablePoints}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">Speed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "speed",
                          Math.max(0, statAllocations.speed - 1)
                        )
                      }
                      disabled={statAllocations.speed <= 0}
                    >
                      -
                    </Button>
                    <span className="text-white font-semibold w-8 text-center">
                      {statAllocations.speed}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange("speed", statAllocations.speed + 1)
                      }
                      disabled={totalAllocated >= availablePoints}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Perception */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-gray-300">Perception</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "perception",
                          Math.max(0, statAllocations.perception - 1)
                        )
                      }
                      disabled={statAllocations.perception <= 0}
                    >
                      -
                    </Button>
                    <span className="text-white font-semibold w-8 text-center">
                      {statAllocations.perception}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "perception",
                          statAllocations.perception + 1
                        )
                      }
                      disabled={totalAllocated >= availablePoints}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Agility */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-gray-300">Agility</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "agility",
                          Math.max(0, statAllocations.agility - 1)
                        )
                      }
                      disabled={statAllocations.agility <= 0}
                    >
                      -
                    </Button>
                    <span className="text-white font-semibold w-8 text-center">
                      {statAllocations.agility}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange("agility", statAllocations.agility + 1)
                      }
                      disabled={totalAllocated >= availablePoints}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Critical Chance */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-pink-400" />
                    <span className="text-sm text-gray-300">Crit Chance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "criticalChance",
                          Math.max(0, statAllocations.criticalChance - 1)
                        )
                      }
                      disabled={statAllocations.criticalChance <= 0}
                    >
                      -
                    </Button>
                    <span className="text-white font-semibold w-8 text-center">
                      {statAllocations.criticalChance}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "criticalChance",
                          statAllocations.criticalChance + 1
                        )
                      }
                      disabled={totalAllocated >= availablePoints}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Block Strength */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm text-gray-300">
                      Block Strength
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "blockStrength",
                          Math.max(0, statAllocations.blockStrength - 1)
                        )
                      }
                      disabled={statAllocations.blockStrength <= 0}
                    >
                      -
                    </Button>
                    <span className="text-white font-semibold w-8 text-center">
                      {statAllocations.blockStrength}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatChange(
                          "blockStrength",
                          statAllocations.blockStrength + 1
                        )
                      }
                      disabled={totalAllocated >= availablePoints}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Points Summary */}
              <div className="bg-gray-800/30 rounded-lg p-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    Points Allocated:
                  </span>
                  <span
                    className={`font-semibold ${
                      totalAllocated === availablePoints
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {totalAllocated} / {availablePoints}
                  </span>
                </div>
                {totalAllocated < availablePoints && (
                  <p className="text-xs text-gray-500 mt-1">
                    {availablePoints - totalAllocated} points remaining
                  </p>
                )}
              </div>

              {/* Validation Error */}
              {!validation.isValid && (
                <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-300">
                      {validation.error}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={levelUpMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleLevelUp}
                disabled={!canConfirm || levelUpMutation.isPending}
                className="flex-1"
              >
                {levelUpMutation.isPending ? "Leveling Up..." : "Level Up!"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
