"use client";

import { JumpingGapsGame } from "./JumpingGapsGame";
import { ClosingWallsGame } from "./ClosingWallsGame";
import { LockPickingGame } from "./LockPickingGame";
import { RiddleGame } from "./RiddleGame";
import { QuickTimeGame } from "./QuickTimeGame";
import { CombatClickerGame } from "./CombatClickerGame";

export type MinigameType =
  | "JUMPING_GAPS"
  | "CLOSING_WALLS"
  | "LOCK_PICKING"
  | "RIDDLE"
  | "QUICK_TIME"
  | "COMBAT_CLICKER"
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
  partyMembers?: Array<{
    id: string;
    name: string;
    currentHealth: number;
    maxHealth: number;
    attack: number;
    defense: number;
    agility?: number;
    blockStrength?: number;
  }>;
  event?: {
    eventData?: {
      combatState?: any;
    };
  };
}

export function MinigameContainer({
  type,
  config,
  onComplete,
  playerStats,
  partyMembers = [],
  event,
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
    case "COMBAT_CLICKER":
      return (
        <CombatClickerGame
          config={config}
          playerStats={playerStats}
          partyMembers={partyMembers}
          event={event}
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

// Helper function to map event types to minigame types
export function getMinigameTypeForEvent(event: {
  type: string;
  template?: { minigameType?: string };
}): MinigameType {
  // First check if the template has a specific minigame type
  if (event.template?.minigameType) {
    return event.template.minigameType as MinigameType;
  }

  // Fallback to default mapping based on event type
  switch (event.type) {
    case "COMBAT":
      return "COMBAT_CLICKER";
    case "TRAP":
      return "QUICK_TIME";
    case "PUZZLE":
      return "RIDDLE";
    case "TREASURE":
      return "LOCK_PICKING";
    case "ENVIRONMENTAL_HAZARD":
      return "CLOSING_WALLS";
    case "CHOICE":
    case "NPC_ENCOUNTER":
    case "REST":
    default:
      return "NONE";
  }
}
