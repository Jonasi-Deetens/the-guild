"use client";

import { useState, useEffect } from "react";

interface MissionAnimationProps {
  environmentType: string;
  remainingTime: number;
  totalDuration: number;
  className?: string;
}

interface AnimationText {
  text: string;
  duration: number;
}

export function MissionAnimation({
  environmentType,
  remainingTime,
  totalDuration,
  className = "",
}: MissionAnimationProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);

  // Calculate urgency based on remaining time
  const timePercentage = remainingTime / totalDuration;
  const isLowTime = timePercentage < 0.2; // Less than 20% time remaining

  // Get animation texts based on environment type
  const getAnimationTexts = (): AnimationText[] => {
    const baseTexts = {
      dungeon_corridor: [
        { text: "Walking through the dark corridor...", duration: 3000 },
        { text: "Exploring ancient chambers...", duration: 2500 },
        { text: "Navigating through stone passages...", duration: 3500 },
        { text: "Searching for hidden passages...", duration: 2000 },
        { text: "Moving deeper into the dungeon...", duration: 3000 },
      ],
      forest_path: [
        { text: "Traversing the forest path...", duration: 3000 },
        { text: "Moving through dense woods...", duration: 2500 },
        { text: "Following the winding trail...", duration: 3500 },
        { text: "Listening to the sounds of nature...", duration: 2000 },
        { text: "Walking under the canopy...", duration: 3000 },
      ],
      cave_tunnel: [
        { text: "Navigating cave tunnels...", duration: 3000 },
        { text: "Climbing rocky passages...", duration: 2500 },
        { text: "Exploring underground chambers...", duration: 3500 },
        { text: "Moving through narrow passages...", duration: 2000 },
        { text: "Descending deeper into the cave...", duration: 3000 },
      ],
      mountain_path: [
        { text: "Climbing the mountain path...", duration: 3000 },
        { text: "Navigating rocky terrain...", duration: 2500 },
        { text: "Ascending the steep slope...", duration: 3500 },
        { text: "Moving through mountain passes...", duration: 2000 },
        { text: "Reaching higher elevations...", duration: 3000 },
      ],
      desert_dunes: [
        { text: "Crossing the desert dunes...", duration: 3000 },
        { text: "Moving through shifting sands...", duration: 2500 },
        { text: "Following ancient trade routes...", duration: 3500 },
        { text: "Seeking shelter from the sun...", duration: 2000 },
        { text: "Navigating the vast desert...", duration: 3000 },
      ],
    };

    return (
      baseTexts[environmentType as keyof typeof baseTexts] ||
      baseTexts.dungeon_corridor
    );
  };

  // Get urgent texts (when time is running low)
  const getUrgentTexts = (): AnimationText[] => {
    const urgentTexts = {
      dungeon_corridor: [
        { text: "Running through the corridor!", duration: 1500 },
        { text: "Hastily exploring chambers!", duration: 1200 },
        { text: "Rushing through passages!", duration: 1800 },
        { text: "Desperately searching for exits!", duration: 1000 },
      ],
      forest_path: [
        { text: "Sprinting down the forest path!", duration: 1500 },
        { text: "Rushing through the woods!", duration: 1200 },
        { text: "Running along the trail!", duration: 1800 },
        { text: "Frantically moving forward!", duration: 1000 },
      ],
      cave_tunnel: [
        { text: "Rushing through cave tunnels!", duration: 1500 },
        { text: "Climbing passages quickly!", duration: 1200 },
        { text: "Running through chambers!", duration: 1800 },
        { text: "Desperately seeking the exit!", duration: 1000 },
      ],
      mountain_path: [
        { text: "Climbing the mountain rapidly!", duration: 1500 },
        { text: "Rushing up rocky terrain!", duration: 1200 },
        { text: "Sprinting up the slope!", duration: 1800 },
        { text: "Desperately reaching for the peak!", duration: 1000 },
      ],
      desert_dunes: [
        { text: "Running across the dunes!", duration: 1500 },
        { text: "Rushing through the sands!", duration: 1200 },
        { text: "Sprinting across the desert!", duration: 1800 },
        { text: "Desperately seeking shelter!", duration: 1000 },
      ],
    };

    return (
      urgentTexts[environmentType as keyof typeof urgentTexts] ||
      urgentTexts.dungeon_corridor
    );
  };

  const animationTexts = isLowTime ? getUrgentTexts() : getAnimationTexts();

  // Cycle through animation texts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % animationTexts.length);
    }, animationTexts[currentTextIndex]?.duration || 3000);

    return () => clearInterval(interval);
  }, [currentTextIndex, animationTexts]);

  // Update urgency state
  useEffect(() => {
    setIsUrgent(isLowTime);
  }, [isLowTime]);

  // Format remaining time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Get environment icon
  const getEnvironmentIcon = (): string => {
    const icons = {
      dungeon_corridor: "🏰",
      forest_path: "🌲",
      cave_tunnel: "🕳️",
      mountain_path: "⛰️",
      desert_dunes: "🏜️",
    };
    return icons[environmentType as keyof typeof icons] || "🏰";
  };

  return (
    <div
      className={`flex flex-col items-center justify-center h-full ${className}`}
    >
      {/* Environment Icon */}
      <div className="text-6xl mb-6 animate-pulse">{getEnvironmentIcon()}</div>

      {/* Mission Timer */}
      <div
        className={`text-2xl font-bold mb-4 ${
          isUrgent ? "text-red-400" : "text-white"
        }`}
      >
        {formatTime(remainingTime)}
      </div>

      {/* Progress Bar */}
      <div className="w-64 h-2 bg-gray-700 rounded-full mb-6 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? "bg-red-500" : "bg-blue-500"
          }`}
          style={{
            width: `${Math.max(0, (remainingTime / totalDuration) * 100)}%`,
          }}
        />
      </div>

      {/* Animation Text */}
      <div className="text-center">
        <div
          className={`text-lg font-medium transition-all duration-500 ${
            isUrgent ? "text-red-300" : "text-gray-300"
          }`}
          key={currentTextIndex}
        >
          {animationTexts[currentTextIndex]?.text || "Exploring..."}
        </div>

        {/* Urgency Indicator */}
        {isUrgent && (
          <div className="text-sm text-red-400 mt-2 animate-pulse">
            ⚠️ Time is running out!
          </div>
        )}
      </div>

      {/* Environment-specific decorations */}
      <div className="mt-8 text-4xl opacity-30">
        {environmentType === "dungeon_corridor" && "⚔️"}
        {environmentType === "forest_path" && "🍃"}
        {environmentType === "cave_tunnel" && "💎"}
        {environmentType === "mountain_path" && "🏔️"}
        {environmentType === "desert_dunes" && "🌵"}
      </div>
    </div>
  );
}
