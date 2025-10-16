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
  onRightClick?: (monsterId: string, event: React.MouseEvent) => void;
  isClickable?: boolean;
  blockState?: {
    isVisible: boolean;
    startTime?: number;
    duration?: number;
  };
}

export const MonsterCard: React.FC<MonsterCardProps> = ({
  monster,
  currentTime,
  onClick,
  onRightClick,
  isClickable = true,
  blockState,
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

  // Calculate timing windows for block/parry indicators
  const timeUntilAttackMs = monster.nextAttackTime
    ? monster.nextAttackTime - currentTime
    : 0;

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

  // Determine timer color based on timing windows
  let timerColor = "bg-red-500"; // Default red
  let timerGlow = "";

  if (timeUntilAttackMs <= parryWindow && timeUntilAttackMs > 0) {
    // Parry window - yellow with glow
    timerColor = "bg-yellow-500";
    timerGlow = "shadow-yellow-500/50 shadow-lg";
  } else if (timeUntilAttackMs <= blockWindow && timeUntilAttackMs > 0) {
    // Block window - green with glow
    timerColor = "bg-green-500";
    timerGlow = "shadow-green-500/50 shadow-lg";
  }

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

  const getMonsterImage = (monsterName: string) => {
    // Map monster names to their image files
    const imageMap: Record<string, string> = {
      "Training Dummy": "/assets/training_dummy.png",
      "Advanced Training Dummy": "/assets/advanced_training_dummy.png",
      "Master Training Dummy": "/assets/master_training_dummy.png",
      "Blue Slime": "/assets/training_dummy.png", // Fallback until we have slime images
      "Red Slime": "/assets/training_dummy.png",
      "Green Slime": "/assets/training_dummy.png",
      "Slime King": "/assets/training_dummy.png",
      "Bandit Thug": "/assets/training_dummy.png", // Fallback until we have bandit images
      "Bandit Archer": "/assets/training_dummy.png",
      "Bandit Rogue": "/assets/training_dummy.png",
      "Bandit Leader": "/assets/training_dummy.png",
    };

    return imageMap[monsterName] || "/assets/training_dummy.png";
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
      onContextMenu={
        isClickable && monster.health > 0
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onRightClick?.(monster.id, e);
            }
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
          src={getMonsterImage(monster.name)}
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
              className={`${timerColor} h-1 rounded-full transition-all duration-75 ${timerGlow}`}
              style={{ width: `${attackProgress}%` }}
            />
          </div>
          <p
            className={`text-xs text-center ${
              timeUntilAttackMs <= parryWindow && timeUntilAttackMs > 0
                ? "text-yellow-400 font-bold"
                : timeUntilAttackMs <= blockWindow && timeUntilAttackMs > 0
                ? "text-green-400 font-bold"
                : "text-red-400"
            }`}
          >
            {timeUntilAttack}s
          </p>
        </div>
      )}

      {/* Block/Parry Indicator */}
      {monster.health > 0 &&
        blockState?.blockStatus &&
        blockState.blockStatus !== "none" && (
          <div className="absolute bottom-2 left-2 right-2">
            <div
              className={`text-white text-xs px-2 py-1 rounded text-center font-bold animate-pulse ${
                blockState.blockStatus === "parry"
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
            >
              🛡️{" "}
              {blockState.blockStatus === "parry" ? "PARRY SET" : "BLOCK SET"}
            </div>
          </div>
        )}
    </div>
  );
};
