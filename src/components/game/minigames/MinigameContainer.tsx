"use client";

import { JumpingGapsGame } from "./JumpingGapsGame";
import { ClosingWallsGame } from "./ClosingWallsGame";
import { LockPickingGame } from "./LockPickingGame";
import { RiddleGame } from "./RiddleGame";
import { QuickTimeGame } from "./QuickTimeGame";

export type MinigameType =
  | "JUMPING_GAPS"
  | "CLOSING_WALLS"
  | "LOCK_PICKING"
  | "RIDDLE"
  | "QUICK_TIME"
  | "NONE";

interface MinigameContainerProps {
  type: MinigameType;
  config: any;
  onComplete: (result: any) => void;
  playerStats: {
    speed: number;
    perception: number;
    attack: number;
    defense: number;
  };
}

export function MinigameContainer({
  type,
  config,
  onComplete,
  playerStats,
}: MinigameContainerProps) {
  switch (type) {
    case "JUMPING_GAPS":
      return (
        <JumpingGapsGame
          config={config}
          playerStats={playerStats}
          onComplete={onComplete}
        />
      );
    case "CLOSING_WALLS":
      return (
        <ClosingWallsGame
          config={config}
          playerStats={playerStats}
          onComplete={onComplete}
        />
      );
    case "LOCK_PICKING":
      return (
        <LockPickingGame
          config={config}
          playerStats={playerStats}
          onComplete={onComplete}
        />
      );
    case "RIDDLE":
      return (
        <RiddleGame
          config={config}
          playerStats={playerStats}
          onComplete={onComplete}
        />
      );
    case "QUICK_TIME":
      return (
        <QuickTimeGame
          config={config}
          playerStats={playerStats}
          onComplete={onComplete}
        />
      );
    default:
      return (
        <div className="p-8 text-center">
          <p className="text-gray-400">No minigame required for this event.</p>
        </div>
      );
  }
}
