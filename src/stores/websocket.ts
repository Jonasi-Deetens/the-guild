import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/server/websocket";

interface WebSocketState {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  connectedPlayers: Array<{
    id: string;
    name: string;
    level: number;
    reputation: number;
  }>;
  currentParty: {
    id: string;
    members: any[];
    status: string;
  } | null;
  partyChat: Array<{
    message: string;
    sender: string;
    timestamp: string;
  }>;
  recentActivity: Array<{
    id: string;
    message: string;
    type: string;
    timestamp: string;
  }>;
  currentSession: {
    sessionId: string;
    missionName: string;
    status: string;
    remainingTime: number;
    totalDuration: number;
    isPaused: boolean;
    currentEventId: string | null;
  } | null;
  levelUpNotification: {
    newLevel: number;
    statIncreases: any;
    totalExperience: number;
  } | null;
  levelUpAvailableNotification: {
    pendingLevels: number;
    currentExperience: number;
    requiredExperience: number;
    pendingStatPoints: number;
  } | null;
  experienceUpdateNotification: {
    newExperience: number;
    experienceGained: number;
  } | null;
  lastEvent: {
    type: string;
    sessionId?: string;
    [key: string]: any;
  } | null;
}

interface WebSocketActions {
  connect: (characterId: string) => void;
  disconnect: () => void;
  joinHub: (characterId: string) => void;
  leaveHub: () => void;
  createParty: (data: {
    name?: string;
    isPublic: boolean;
    maxMembers: number;
  }) => void;
  joinParty: (partyId: string) => void;
  leaveParty: () => void;
  toggleReady: (isReady: boolean) => void;
  sendPartyMessage: (message: {
    message: string;
    sender: string;
    timestamp: string;
  }) => void;
  submitDungeonAction: (data: {
    sessionId: string;
    action: string;
    targetId?: string;
    itemId?: string;
  }) => void;
  requestTrade: (data: {
    targetId: string;
    items: any[];
    gold: number;
  }) => void;
  attemptTheft: (targetId: string) => void;
  sendMessage: (message: any) => void;
  addActivity: (activity: {
    id: string;
    message: string;
    type: string;
    timestamp: string;
  }) => void;
  addPartyMessage: (message: {
    message: string;
    sender: string;
    timestamp: string;
  }) => void;
  updateConnectedPlayers: (
    players: Array<{
      id: string;
      name: string;
      level: number;
      reputation: number;
    }>
  ) => void;
  updateParty: (party: { id: string; members: any[]; status: string }) => void;
  updateSession: (session: {
    sessionId: string;
    missionName: string;
    status: string;
    remainingTime: number;
    totalDuration: number;
    isPaused: boolean;
    currentEventId: string | null;
  }) => void;
  updateMissionTimer: (data: {
    sessionId: string;
    remainingTime: number;
    isPaused: boolean;
  }) => void;
  onEventSpawned: (data: {
    sessionId: string;
    eventId: string;
    eventType: string;
  }) => void;
  onEventCompleted: (data: {
    sessionId: string;
    eventId: string;
    results: any;
  }) => void;
  onMissionCompleted: (data: { sessionId: string; rewards: any }) => void;
  onMissionFailed: (data: { sessionId: string; reason: string }) => void;
  setLevelUpNotification: (
    notification: {
      newLevel: number;
      statIncreases: any;
      totalExperience: number;
    } | null
  ) => void;
  setLevelUpAvailableNotification: (
    notification: {
      pendingLevels: number;
      currentExperience: number;
      requiredExperience: number;
      pendingStatPoints: number;
    } | null
  ) => void;
  setExperienceUpdateNotification: (
    notification: {
      newExperience: number;
      experienceGained: number;
    } | null
  ) => void;
}

export const useWebSocketStore = create<WebSocketState & WebSocketActions>(
  (set, get) => ({
    // State
    socket: null,
    isConnected: false,
    connectedPlayers: [],
    currentParty: null,
    partyChat: [],
    recentActivity: [],
    currentSession: null,
    levelUpNotification: null,
    levelUpAvailableNotification: null,
    experienceUpdateNotification: null,
    lastEvent: null,

    // Actions
    connect: (characterId: string) => {
      const socket = io(
        process.env.NODE_ENV === "production" ? "" : "http://localhost:3000",
        {
          autoConnect: true,
        }
      );

      socket.on("connect", () => {
        console.log("Connected to WebSocket server");
        set({ isConnected: true });
        get().joinHub(characterId);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from WebSocket server");
        set({ isConnected: false });
      });

      socket.on("playerJoined", (player) => {
        set((state) => ({
          connectedPlayers: [...state.connectedPlayers, player],
        }));
      });

      socket.on("playerLeft", (playerId) => {
        set((state) => ({
          connectedPlayers: state.connectedPlayers.filter(
            (p) => p.id !== playerId
          ),
        }));
      });

      socket.on("activityUpdate", (activity) => {
        get().addActivity(activity);
      });

      socket.on("partyUpdate", (data) => {
        get().updateParty(data);
      });

      socket.on("partyChat", (message) => {
        get().addPartyMessage(message);
      });

      socket.on("dungeonStarted", (data) => {
        console.log("Dungeon started:", data);
        // Handle dungeon start
      });

      socket.on("missionStarted", (data) => {
        get().updateSession(data);
      });

      socket.on("missionTimerUpdate", (data) => {
        get().updateMissionTimer(data);
      });

      socket.on("eventSpawned", (data) => {
        get().onEventSpawned(data);
      });

      socket.on("eventCompleted", (data) => {
        get().onEventCompleted(data);
      });

      socket.on("missionCompleted", (data) => {
        get().onMissionCompleted(data);
      });

      socket.on("missionFailed", (data) => {
        get().onMissionFailed(data);
      });

      socket.on("characterLeveledUp", (data) => {
        console.log("Character leveled up:", data);
        set({ levelUpNotification: data });
      });

      socket.on("characterLevelUpAvailable", (data) => {
        console.log("Character level up available:", data);
        set({ levelUpAvailableNotification: data });
      });

      socket.on("characterExperienceUpdated", (data) => {
        console.log("🎯 [WebSocket] Character experience updated:", data);
        set({ experienceUpdateNotification: data });
      });

      socket.on("partyMessage", (data) => {
        console.log("Party message received:", data);
        const { partyChat } = get();
        set({
          partyChat: [...partyChat, data],
        });
      });

      socket.on("tradeRequest", (data) => {
        console.log("Trade request:", data);
        // Handle trade request
      });

      socket.on("theftAttempt", (data) => {
        console.log("Theft attempt:", data);
        // Handle theft attempt
      });

      socket.on("error", (error) => {
        console.error("WebSocket error:", error);
      });

      set({ socket });
    },

    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ socket: null, isConnected: false });
      }
    },

    joinHub: (characterId: string) => {
      const { socket } = get();
      if (socket) {
        socket.emit("joinHub", characterId);
      }
    },

    leaveHub: () => {
      const { socket } = get();
      if (socket) {
        socket.emit("leaveHub");
      }
    },

    createParty: (data) => {
      const { socket } = get();
      if (socket) {
        socket.emit("createParty", data);
      }
    },

    joinParty: (partyId: string) => {
      const { socket } = get();
      if (socket) {
        socket.emit("joinParty", partyId);
      }
    },

    leaveParty: () => {
      const { socket } = get();
      if (socket) {
        socket.emit("leaveParty");
        set({ currentParty: null, partyChat: [] });
      }
    },

    toggleReady: (isReady: boolean) => {
      const { socket } = get();
      if (socket) {
        socket.emit("toggleReady", isReady);
      }
    },

    sendPartyMessage: (messageData: {
      message: string;
      sender: string;
      timestamp: string;
    }) => {
      const { socket } = get();
      if (socket) {
        socket.emit("sendPartyMessage", messageData);
      }
    },

    submitDungeonAction: (data) => {
      const { socket } = get();
      if (socket) {
        socket.emit("submitAction", data);
      }
    },

    requestTrade: (data) => {
      const { socket } = get();
      if (socket) {
        socket.emit("requestTrade", data);
      }
    },

    attemptTheft: (targetId: string) => {
      const { socket } = get();
      if (socket) {
        socket.emit("attemptTheft", targetId);
      }
    },

    sendMessage: (message: any) => {
      const { socket } = get();
      if (socket) {
        socket.emit("message", message);
      }
    },

    addActivity: (activity) => {
      set((state) => ({
        recentActivity: [activity, ...state.recentActivity].slice(0, 50), // Keep last 50 activities
      }));
    },

    addPartyMessage: (message) => {
      set((state) => ({
        partyChat: [...state.partyChat, message].slice(-100), // Keep last 100 messages
      }));
    },

    updateConnectedPlayers: (players) => {
      set({ connectedPlayers: players });
    },

    updateParty: (party) => {
      set({ currentParty: party });
    },

    updateSession: (session) => {
      set({ currentSession: session });
    },

    updateMissionTimer: (data) => {
      set((state) => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              remainingTime: data.remainingTime,
              isPaused: data.isPaused,
            }
          : null,
      }));
    },

    onEventSpawned: (data) => {
      set({
        lastEvent: { type: "eventSpawned", ...data },
      });
    },

    onEventCompleted: (data) => {
      set({
        lastEvent: { type: "eventCompleted", ...data },
      });
    },

    onMissionCompleted: (data) => {
      set({
        currentSession: null,
        lastEvent: { type: "missionCompleted", ...data },
      });
    },

    onMissionFailed: (data) => {
      set({
        currentSession: null,
        lastEvent: { type: "missionFailed", ...data },
      });
    },
    setLevelUpNotification: (notification) => {
      set({ levelUpNotification: notification });
    },
    setLevelUpAvailableNotification: (notification) => {
      set({ levelUpAvailableNotification: notification });
    },
    setExperienceUpdateNotification: (notification) => {
      set({ experienceUpdateNotification: notification });
    },
  })
);
