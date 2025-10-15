"use client";

import { CombatClickerGame } from "./CombatClickerGame";

export type MinigameType = "COMBAT_CLICKER" | "NONE";

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

  // Only combat events use minigames now
  switch (event.type) {
    case "COMBAT":
      return "COMBAT_CLICKER";
    default:
      return "NONE";
  }
}
