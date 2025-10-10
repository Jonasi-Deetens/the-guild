"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Star, Heart, Sword, Shield, Zap, Eye } from "@/components/icons";

interface LevelUpNotificationProps {
  notification: {
    newLevel: number;
    statIncreases: {
      maxHealth: { increment: number };
      attack: { increment: number };
      defense: { increment: number };
      speed: { increment: number };
      perception: { increment: number };
    };
    totalExperience: number;
  } | null;
  onClose: () => void;
}

export function LevelUpNotification({
  notification,
  onClose,
}: LevelUpNotificationProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (notification) {
      setShowAnimation(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const { newLevel, statIncreases, totalExperience } = notification;

  return (
    <Modal isOpen={true} onClose={onClose} title="">
      <div className="p-8 text-center">
        {/* Level Up Animation */}
        <div
          className={`mb-6 transition-all duration-1000 ${
            showAnimation ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <div className="text-8xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-yellow-400 mb-2">LEVEL UP!</h2>
          <div className="text-6xl font-bold text-white mb-4">
            Level {newLevel}
          </div>
        </div>

        {/* Stat Increases */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Stat Increases
          </h3>
          <div className="grid grid-cols-2 gap-4 text-left">
            {statIncreases.maxHealth.increment > 0 && (
              <div className="flex items-center space-x-3">
                <Heart className="h-5 w-5 text-red-400" />
                <span className="text-gray-300">Max Health:</span>
                <span className="text-green-400 font-semibold">
                  +{statIncreases.maxHealth.increment}
                </span>
              </div>
            )}
            {statIncreases.attack.increment > 0 && (
              <div className="flex items-center space-x-3">
                <Sword className="h-5 w-5 text-orange-400" />
                <span className="text-gray-300">Attack:</span>
                <span className="text-green-400 font-semibold">
                  +{statIncreases.attack.increment}
                </span>
              </div>
            )}
            {statIncreases.defense.increment > 0 && (
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">Defense:</span>
                <span className="text-green-400 font-semibold">
                  +{statIncreases.defense.increment}
                </span>
              </div>
            )}
            {statIncreases.speed.increment > 0 && (
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="text-gray-300">Speed:</span>
                <span className="text-green-400 font-semibold">
                  +{statIncreases.speed.increment}
                </span>
              </div>
            )}
            {statIncreases.perception.increment > 0 && (
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300">Perception:</span>
                <span className="text-green-400 font-semibold">
                  +{statIncreases.perception.increment}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Experience Info */}
        <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="text-gray-300">Total Experience:</span>
            <span className="text-yellow-400 font-semibold">
              {totalExperience}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3"
        >
          Continue Adventure
        </Button>
      </div>
    </Modal>
  );
}
