import React from "react";
import { Crown, Star, Zap } from "@/components/icons";

interface MonsterCardProps {
  monster: {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    rarity?: string;
    nextAttackTime?: number;
    attackInterval?: number;
  };
  currentTime: number;
  onClick?: (monsterId: string, event: React.MouseEvent) => void;
  isClickable?: boolean;
}

export const MonsterCard: React.FC<MonsterCardProps> = ({
  monster,
  currentTime,
  onClick,
  isClickable = true,
}) => {
  const healthPercentage = (monster.health / monster.maxHealth) * 100;

  // Calculate attack timer progress
  const attackProgress =
    monster.nextAttackTime && monster.attackInterval
      ? Math.max(
          0,
          Math.min(
            100,
            ((monster.nextAttackTime - currentTime) /
              (monster.attackInterval * 1000)) *
              100
          )
        )
      : 0;

  const timeUntilAttack = monster.nextAttackTime
    ? Math.max(0, Math.ceil((monster.nextAttackTime - currentTime) / 1000))
    : 0;

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "BOSS":
        return <Crown className="h-3 w-3 text-yellow-400" />;
      case "RARE":
        return <Star className="h-3 w-3 text-blue-400" />;
      case "ELITE":
        return <Zap className="h-3 w-3 text-purple-400" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative p-3 min-w-[120px] ${
        isClickable && monster.health > 0
          ? "cursor-pointer hover:opacity-80 transition-all duration-200"
          : "cursor-default"
      }`}
      onClick={
        isClickable && monster.health > 0
          ? (e) => onClick?.(monster.id, e)
          : undefined
      }
    >
      {/* HP Bar */}
      <div className="absolute -top-1 left-2 right-2 z-10">
        <div className="w-full bg-gray-600 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-200 ${
              healthPercentage > 60
                ? "bg-green-500"
                : healthPercentage > 30
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${healthPercentage}%` }}
          />
        </div>
      </div>

      {/* Rarity Icon */}
      {monster.rarity && (
        <div className="absolute top-2 right-2 z-10">
          {getRarityIcon(monster.rarity)}
        </div>
      )}

      {/* Monster Image */}
      <div className="relative w-16 h-16 mx-auto mb-2">
        <img
          src="/assets/training_dummy.png"
          alt={monster.name}
          className="w-full h-full object-cover rounded-lg"
        />
        {monster.health <= 0 && (
          <div className="absolute inset-0 bg-red-900/70 rounded-lg flex items-center justify-center">
            <span className="text-red-400 text-xs font-bold">DEAD</span>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center mb-2">
        <p className="text-xs text-white font-medium truncate">
          {monster.name}
        </p>
      </div>

      {/* Attack Timer */}
      {monster.health > 0 && monster.nextAttackTime && (
        <div className="space-y-1">
          <div className="w-full bg-gray-600 rounded-full h-1">
            <div
              className="bg-red-500 h-1 rounded-full transition-all duration-75"
              style={{ width: `${attackProgress}%` }}
            />
          </div>
          <p className="text-xs text-red-400 text-center">{timeUntilAttack}s</p>
        </div>
      )}
    </div>
  );
};
