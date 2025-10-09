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
    turnNumber: number;
    timeLimit: number;
    endsAt: string;
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
  sendPartyMessage: (message: string) => void;
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
    turnNumber: number;
    timeLimit: number;
    endsAt: string;
  }) => void;
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

      socket.on("turnStarted", (data) => {
        get().updateSession(data);
      });

      socket.on("turnEnded", (data) => {
        console.log("Turn ended:", data);
        // Handle turn end
      });

      socket.on("dungeonCompleted", (data) => {
        console.log("Dungeon completed:", data);
        set({ currentSession: null });
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

    sendPartyMessage: (message: string) => {
      const { socket } = get();
      if (socket) {
        socket.emit("sendPartyMessage", message);
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
  })
);
