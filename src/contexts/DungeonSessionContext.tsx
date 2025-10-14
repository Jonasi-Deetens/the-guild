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
  nextEventSpawnTime: string | null;
  currentEventId: string | null;
  mission: {
    name: string;
    description: string;
    difficulty: number;
    baseReward: number;
    experienceReward: number;
    baseDuration: number;
    environmentType: string;
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
      };
      isReady: boolean;
    }>;
  };
  events: Array<{
    id: string;
    status: string;
    eventNumber: number;
    eventData: any;
    results: any;
    template: {
      type: string;
      name: string;
      description: string;
      minigameType?: string;
      config?: any;
    };
    playerActions: Array<{
      characterId: string;
      actionType: string;
      actionData: any;
      result: any;
    }>;
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
  currentEvent: any;
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
      refetchInterval: 5000, // Poll every 5 seconds
    }
  );

  // Fetch current character data
  const {
    data: characterData,
    refetch: refetchCharacter,
    isLoading: characterLoading,
  } = api.character.getCurrentCharacter.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds to get updated stats
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

  const currentEvent = useMemo(() => {
    if (!session) return null;

    console.log("🔍 [DungeonSessionContext] Finding current event:", {
      currentEventId: session.currentEventId,
      eventsCount: session.events.length,
      events: session.events.map((e) => ({
        id: e.id,
        status: e.status,
        type: e.template?.type,
      })),
    });

    const found = session.events.find(
      (event) =>
        event.id === session.currentEventId && event.status === "ACTIVE"
    );

    console.log(
      "🔍 [DungeonSessionContext] Current event found:",
      found
        ? {
            id: found.id,
            status: found.status,
            type: found.template?.type,
          }
        : null
    );

    return found || null;
  }, [session]);

  const hasPlayerSubmittedAction = useMemo(() => {
    if (!currentEvent || !characterData) return false;
    return currentEvent.playerActions.some(
      (action: any) => action.characterId === characterData.id
    );
  }, [currentEvent, characterData]);

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

  // Single polling interval for active missions
  useEffect(() => {
    if (session?.status === "ACTIVE" || session?.status === "WAITING") {
      const interval = setInterval(() => {
        refetchSession();
        refetchCharacter();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [session?.status, refetchSession, refetchCharacter]);

  const partyMembers = useMemo(() => {
    // For party missions, return party members
    if (session?.party) {
      return session.party.members.map((member) => ({
        id: member.character.id,
        name: member.character.name,
        currentHealth: member.character.currentHealth,
        maxHealth: member.character.maxHealth,
        attack: member.character.attack,
        defense: member.character.defense,
        level: member.character.level,
        isDead: member.character.currentHealth <= 0,
      }));
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

  const isLoading = sessionLoading || characterLoading;

  // Actions
  const refetchAll = () => {
    refetchSession();
    refetchCharacter();
  };

  const submitAction = (action: string, actionData: any) => {
    if (!currentEvent || !characterData) return;

    submitActionMutation.mutate({
      sessionId,
      eventId: currentEvent.id,
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
    currentEvent,
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
