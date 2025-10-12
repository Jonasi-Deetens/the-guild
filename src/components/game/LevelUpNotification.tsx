"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  Star,
  Heart,
  Sword,
  Shield,
  Zap,
  Eye,
  Crown,
} from "@/components/icons";
import { ParticleEffect } from "./ParticleEffect";

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
      <div className="p-8 text-center relative">
        <ParticleEffect
          isActive={showAnimation}
          type="celebration"
          duration={5000}
          particleCount={60}
          className="z-10"
        />
        <div className="relative z-20">
          {/* Level Up Available Animation */}
          <div
            className={`mb-6 transition-all duration-1000 ${
              showAnimation ? "scale-100 opacity-100" : "scale-50 opacity-0"
            }`}
          >
            <div className="text-8xl mb-4">⭐</div>
            <h2 className="text-4xl font-bold text-yellow-400 mb-2">
              LEVEL UP AVAILABLE!
            </h2>
            <div className="text-2xl font-bold text-white mb-4">
              You can now level up to Level {newLevel}
            </div>
          </div>
        </div>

        {/* Level Up Info */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Ready to Level Up
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              <span className="text-gray-300">New Level:</span>
              <span className="text-yellow-400 font-semibold">{newLevel}</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-gray-300">Total Experience:</span>
              <span className="text-yellow-400 font-semibold">
                {totalExperience.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="h-5 w-5 text-blue-400" />
            <span className="text-blue-400 font-semibold">How to Level Up</span>
          </div>
          <p className="text-gray-300 text-sm">
            Return to the hub to allocate your stat points and complete your
            level up. You'll be able to choose how to distribute your stat
            increases!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Continue Adventure
          </Button>
          <Button
            onClick={() => {
              onClose();
              // Navigate to hub - this would need to be passed as a prop or use router
              window.location.href = "/game/hub";
            }}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
          >
            Go to Hub
          </Button>
        </div>
      </div>
    </Modal>
  );
}
