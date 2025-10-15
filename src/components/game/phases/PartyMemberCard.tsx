import React from "react";
import { Heart } from "@/components/icons";

interface PartyMemberCardProps {
  member: {
    id: string;
    name: string;
    currentHealth: number;
    maxHealth: number;
    isDead: boolean;
    isNPC?: boolean;
    nextAttackTime?: number;
    attackInterval?: number;
  };
  currentTime: number;
}

export const PartyMemberCard: React.FC<PartyMemberCardProps> = ({
  member,
  currentTime,
}) => {
  const healthPercentage = (member.currentHealth / member.maxHealth) * 100;

  // Calculate attack timer progress
  const attackProgress =
    member.nextAttackTime && member.attackInterval
      ? Math.max(
          0,
          Math.min(
            100,
            ((member.nextAttackTime - currentTime) /
              (member.attackInterval * 1000)) *
              100
          )
        )
      : 0;

  const timeUntilAttack = member.nextAttackTime
    ? Math.max(0, Math.ceil((member.nextAttackTime - currentTime) / 1000))
    : 0;

  return (
    <div className="relative p-3 min-w-[120px]">
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

      {/* Character Image */}
      <div className="relative w-16 h-16 mx-auto mb-2">
        <img
          src="/assets/training_dummy.png"
          alt={member.name}
          className="w-full h-full object-cover rounded-lg"
        />
        {member.isDead && (
          <div className="absolute inset-0 bg-red-900/70 rounded-lg flex items-center justify-center">
            <span className="text-red-400 text-xs font-bold">DEAD</span>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center mb-2">
        <p className="text-xs text-white font-medium truncate">{member.name}</p>
        {member.isNPC && <span className="text-xs text-blue-400">NPC</span>}
      </div>

      {/* Attack Timer */}
      {member.isNPC && member.attackInterval && !member.isDead && (
        <div className="space-y-1">
          <div className="w-full bg-gray-600 rounded-full h-1">
            <div
              className="bg-orange-500 h-1 rounded-full transition-all duration-75"
              style={{ width: `${attackProgress}%` }}
            />
          </div>
          <p className="text-xs text-orange-400 text-center">
            {timeUntilAttack}s
          </p>
        </div>
      )}
    </div>
  );
};
