"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { useWebSocketStore } from "@/stores/websocket";

// Types
interface DungeonSession {
  id: string;
  status: string;
  duration: number;
  missionStartTime: string | null;
  missionEndTime: string | null;
  pausedAt: string | null;
  totalPausedTime: number;
  currentPhaseNumber: number;
  mission: {
    name: string;
    description: string;
    difficulty: number;
    baseReward: number;
    experienceReward: number;
    baseDuration: number;
    environmentType: string;
    totalPhases: number;
    finalBossTemplateId: string | null;
    monsterPoolIds: string[];
    restDuration: number;
  };
  party?: {
    members: Array<{
      character: {
        id: string;
        name: string;
        level: number;
        currentHealth: number;
        maxHealth: number;
        attack: number;
        defense: number;
        speed: number;
        perception: number;
      } | null;
      npcCompanion: {
        id: string;
        name: string;
        level: number;
        currentHealth: number;
        maxHealth: number;
        attack: number;
        defense: number;
        speed: number;
        perception: number;
      } | null;
      isReady: boolean;
      isNPC: boolean;
    }>;
  };
  phases: Array<{
    id: string;
    phaseNumber: number;
    status: string;
    monstersSpawned: any;
    startedAt: string | null;
    completedAt: string | null;
    restStartedAt: string | null;
    restEndedAt: string | null;
  }>;
}

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
}

interface PartyMember {
  id: string;
  name: string;
  currentHealth: number;
  maxHealth: number;
  attack: number;
  defense: number;
  level: number;
  isDead: boolean;
  isNPC?: boolean;
}

interface PlayerStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  perception: number;
}

interface DungeonSessionContextType {
  // Data
  session: DungeonSession | null;
  currentPhase: any;
  phaseStatus: string;
  characterData: any;
  partyChat: ChatMessage[];

  // Computed values
  partyMembers: PartyMember[];
  playerStats: PlayerStats;
  hasPlayerSubmittedAction: boolean;
  remainingTime: number;
  isLoading: boolean;

  // UI state
  showMinigame: boolean;
  showCompletion: boolean;

  // Actions
  refetchSession: () => void;
  refetchCharacter: () => void;
  refetchAll: () => void;
  submitAction: (action: string, actionData: any) => void;
  startMission: () => void;
  sendChatMessage: (message: string) => void;
  setShowMinigame: (show: boolean) => void;
  setShowCompletion: (show: boolean) => void;
}

const DungeonSessionContext = createContext<
  DungeonSessionContextType | undefined
>(undefined);

export function DungeonSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const sessionId = params.sessionId as string;

  // UI state
  const [showMinigame, setShowMinigame] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [partyChat, setPartyChat] = useState<ChatMessage[]>([]);

  const { sendMessage } = useWebSocketStore();

  // Fetch session data
  const {
    data: sessionData,
    refetch: refetchSession,
    isLoading: sessionLoading,
  } = api.dungeon.getSession.useQuery(
    { sessionId },
    {
      enabled: !!sessionId,
      refetchInterval: 1000, // Poll every 1 second for responsive updates
    }
  );

  // Fetch current phase data
  const {
    data: phaseData,
    refetch: refetchPhase,
    isLoading: phaseLoading,
  } = api.phase.getCurrentPhase.useQuery(
    { sessionId },
    {
      enabled: !!sessionId,
      refetchInterval: 500, // Poll every 500ms for responsive combat updates
    }
  );

  // Fetch current character data
  const {
    data: characterData,
    refetch: refetchCharacter,
    isLoading: characterLoading,
  } = api.character.getCurrentCharacter.useQuery(undefined, {
    refetchInterval: 2000, // Poll every 2 seconds to get updated stats
  });

  // Start mission mutation
  const startMissionMutation = api.dungeon.startMission.useMutation({
    onSuccess: () => {
      refetchSession();
    },
  });

  // Submit action mutation
  const submitActionMutation = api.dungeon.submitAction.useMutation({
    onSuccess: () => {
      refetchSession();
    },
  });

  // Computed values
  const session = sessionData as DungeonSession | null;

  const currentPhase = useMemo(() => {
    if (!phaseData) return null;
    return phaseData.currentPhase || null;
  }, [phaseData]);

  // Auto-show minigame when phase becomes active
  useEffect(() => {
    if (
      currentPhase &&
      currentPhase.status === "ACTIVE" &&
      currentPhase.monstersSpawned &&
      currentPhase.monstersSpawned.length > 0
    ) {
      setShowMinigame(true);
    }
  }, [currentPhase]);

  const phaseStatus = useMemo(() => {
    if (!currentPhase) return "PENDING";
    return currentPhase.status || "PENDING";
  }, [currentPhase]);

  const hasPlayerSubmittedAction = useMemo(() => {
    // For phase-based system, we don't track individual action submissions
    // The minigame completion handles the action submission
    return false;
  }, []);

  // Update session state when data changes
  useEffect(() => {
    if (sessionData) {
      // Refetch character data to get updated stats after events complete
      // Add a small delay to ensure rewards are fully processed
      setTimeout(() => {
        refetchCharacter();
      }, 1000);
    }
  }, [sessionData, refetchCharacter]);

  // Watch for mission completion/failure status changes
  useEffect(() => {
    console.log("🔍 Session status changed:", session?.status);
    if (session?.status === "COMPLETED" || session?.status === "FAILED") {
      console.log("🎯 Mission ended, showing completion modal");
      setShowCompletion(true);
    }
  }, [session?.status]);

  // Note: Polling is handled by tRPC refetchInterval settings above

  const partyMembers = useMemo(() => {
    // For party missions, return party members
    if (session?.party) {
      return session.party.members
        .map((member) => {
          // Handle NPCs
          if (member.isNPC && member.npcCompanion) {
            // For phase-based system, NPCs maintain their health from the database
            // Health updates are handled by the combat system and persisted to the database
            let currentHealth =
              member.npcCompanion.currentHealth ||
              member.npcCompanion.maxHealth;
            let isDead = currentHealth <= 0;

            // Calculate attack interval based on speed (faster speed = shorter interval)
            const baseAttackInterval = 6.0; // Base 6 seconds (even slower)
            const speedFactor = Math.max(
              0.8, // Minimum 0.8x speed (slower)
              Math.min(1.3, member.npcCompanion.speed / 20) // Speed 20 = 1.0x, speed 26 = 1.3x
            );
            const attackInterval = baseAttackInterval / speedFactor;

            return {
              id: member.npcCompanion.id,
              name: member.npcCompanion.name,
              currentHealth: currentHealth,
              maxHealth: member.npcCompanion.maxHealth,
              attack: member.npcCompanion.attack,
              defense: member.npcCompanion.defense,
              level: member.npcCompanion.level,
              isDead: isDead,
              isNPC: true,
              attackInterval: attackInterval,
              nextAttackTime: Date.now() + attackInterval * 1000, // Start attacking after full attack interval
            };
          }

          // Handle player characters
          if (member.character) {
            return {
              id: member.character.id,
              name: member.character.name,
              currentHealth: member.character.currentHealth,
              maxHealth: member.character.maxHealth,
              attack: member.character.attack,
              defense: member.character.defense,
              level: member.character.level,
              isDead: member.character.currentHealth <= 0,
              isNPC: false,
            };
          }

          // Fallback for invalid members
          return null;
        })
        .filter(Boolean);
    }

    // For solo missions, return current player as the only member
    if (characterData) {
      return [
        {
          id: characterData.id,
          name: characterData.name,
          currentHealth: characterData.currentHealth,
          maxHealth: characterData.maxHealth,
          attack: characterData.attack,
          defense: characterData.defense,
          level: characterData.level,
          isDead: characterData.currentHealth <= 0,
        },
      ];
    }

    return [];
  }, [session?.party, characterData]);

  const playerStats = useMemo(() => {
    if (!characterData) {
      return {
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        speed: 5,
        perception: 5,
      };
    }

    return {
      health: characterData.currentHealth,
      maxHealth: characterData.maxHealth,
      attack: characterData.attack,
      defense: characterData.defense,
      speed: characterData.speed,
      perception: characterData.perception,
    };
  }, [characterData]);

  const remainingTime = useMemo(() => {
    if (!session || session.status !== "ACTIVE" || !session.missionEndTime) {
      return 0;
    }

    const now = new Date();
    const endTime = new Date(session.missionEndTime);

    // If mission is paused, don't count down
    if (session.pausedAt) {
      const pausedAt = new Date(session.pausedAt);
      const timeLeft = Math.max(0, endTime.getTime() - pausedAt.getTime());
      return Math.floor(timeLeft / 1000);
    }

    const timeLeft = Math.max(0, endTime.getTime() - now.getTime());
    return Math.floor(timeLeft / 1000);
  }, [session]);

  const isLoading = sessionLoading || characterLoading || phaseLoading;

  // Actions
  const refetchAll = () => {
    refetchSession();
    refetchCharacter();
    refetchPhase();
  };

  const submitAction = (action: string, actionData: any) => {
    if (!characterData) return;

    // For phase-based system, we submit actions directly to the dungeon engine
    submitActionMutation.mutate({
      sessionId,
      action,
      actionData,
    });
  };

  const startMission = () => {
    startMissionMutation.mutate({ sessionId });
  };

  const sendChatMessage = (message: string) => {
    sendMessage({
      type: "party_chat",
      data: {
        sender: "You", // This would be the actual character name
        message,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const value: DungeonSessionContextType = {
    // Data
    session,
    currentPhase,
    phaseStatus,
    characterData,
    partyChat,

    // Computed values
    partyMembers,
    playerStats,
    hasPlayerSubmittedAction,
    remainingTime,
    isLoading,

    // UI state
    showMinigame,
    showCompletion,

    // Actions
    refetchSession,
    refetchCharacter,
    refetchAll,
    submitAction,
    startMission,
    sendChatMessage,
    setShowMinigame,
    setShowCompletion,
  };

  return (
    <DungeonSessionContext.Provider value={value}>
      {children}
    </DungeonSessionContext.Provider>
  );
}

export function useDungeonSession() {
  const context = useContext(DungeonSessionContext);
  if (context === undefined) {
    throw new Error(
      "useDungeonSession must be used within a DungeonSessionProvider"
    );
  }
  return context;
}
