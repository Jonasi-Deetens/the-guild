import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { db } from "@/lib/db";

export interface ServerToClientEvents {
  // Hub events
  playerJoined: (player: {
    id: string;
    name: string;
    level: number;
    reputation: number;
  }) => void;
  playerLeft: (playerId: string) => void;
  activityUpdate: (activity: {
    id: string;
    message: string;
    type: string;
    timestamp: string;
  }) => void;

  // Party events
  partyInvite: (data: {
    partyId: string;
    leaderName: string;
    partyName?: string;
  }) => void;
  partyUpdate: (data: {
    partyId: string;
    members: any[];
    status: string;
  }) => void;
  partyChat: (data: {
    message: string;
    sender: string;
    timestamp: string;
  }) => void;

  // Dungeon events
  dungeonStarted: (data: {
    sessionId: string;
    missionName: string;
    turnTimeLimit: number;
    timeline?: any;
    currentEvent?: any;
  }) => void;
  turnStarted: (data: {
    sessionId: string;
    turnNumber: number;
    timeLimit: number;
    endsAt: string;
  }) => void;
  turnEnded: (data: { sessionId: string; results: any[] }) => void;
  dungeonCompleted: (data: {
    sessionId: string;
    success: boolean;
    loot: any[];
  }) => void;

  // New event-based dungeon events
  eventStarted: (data: {
    eventId: string;
    type: string;
    data: any;
    timeLimit: number;
    endsAt: number;
  }) => void;

  playerActed: (data: {
    eventId: string;
    characterId: string;
    actionsRemaining: number;
  }) => void;

  eventCompleted: (data: { eventId: string; results: any }) => void;

  timelineUpdated: (data: { timeline: any; currentEventId: string }) => void;

  // Trade events
  tradeRequest: (data: {
    from: string;
    fromName: string;
    items: any[];
    gold: number;
  }) => void;
  tradeAccepted: (data: { tradeId: string }) => void;
  tradeRejected: (data: { tradeId: string }) => void;

  // Theft events
  theftAttempt: (data: {
    from: string;
    fromName: string;
    amount: number;
    success: boolean;
  }) => void;

  // Character events
  characterLeveledUp: (data: {
    newLevel: number;
    statIncreases: any;
    totalExperience: number;
  }) => void;
  characterLevelUpAvailable: (data: {
    pendingLevels: number;
    currentExperience: number;
    requiredExperience: number;
    pendingStatPoints: number;
  }) => void;
  characterExperienceUpdated: (data: {
    newExperience: number;
    experienceGained: number;
  }) => void;
}

export interface ClientToServerEvents {
  // Hub events
  joinHub: (characterId: string) => void;
  leaveHub: () => void;

  // Party events
  createParty: (data: {
    name?: string;
    isPublic: boolean;
    maxMembers: number;
  }) => void;
  joinParty: (partyId: string) => void;
  leaveParty: () => void;
  toggleReady: (isReady: boolean) => void;
  sendPartyMessage: (messageData: {
    message: string;
    sender: string;
    timestamp: string;
  }) => void;

  // Dungeon events
  submitAction: (data: {
    sessionId: string;
    action: string;
    targetId?: string;
    itemId?: string;
  }) => void;

  // New event-based dungeon events
  submitEventAction: (data: {
    eventId: string;
    actionType: string;
    actionData: any;
  }) => void;

  // Trade events
  requestTrade: (data: {
    targetId: string;
    items: any[];
    gold: number;
  }) => void;
  acceptTrade: (tradeId: string) => void;
  rejectTrade: (tradeId: string) => void;

  // Theft events
  attemptTheft: (targetId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  characterId?: string;
  userId?: string;
  partyId?: string;
  sessionId?: string;
}

export class WebSocketManager {
  private io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  private connectedPlayers = new Map<string, string>(); // characterId -> socketId
  private partyRooms = new Map<string, Set<string>>(); // partyId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >(server, {
      cors: {
        origin:
          process.env.NODE_ENV === "production"
            ? false
            : ["http://localhost:3000"],
        methods: ["GET", "POST"],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Hub events
      socket.on("joinHub", async (characterId) => {
        try {
          const character = await db.character.findUnique({
            where: { id: characterId },
            select: { id: true, name: true, level: true, reputation: true },
          });

          if (!character) {
            socket.emit("error", { message: "Character not found" });
            return;
          }

          socket.data.characterId = characterId;
          this.connectedPlayers.set(characterId, socket.id);

          // Join character-specific room for solo dungeons
          socket.join(`character:${characterId}`);

          // Update character online status
          await db.character.update({
            where: { id: characterId },
            data: { isOnline: true, lastSeen: new Date() },
          });

          // Notify other players
          socket.broadcast.emit("playerJoined", character);

          console.log(`Character ${character.name} joined the hub`);
        } catch (error) {
          console.error("Error joining hub:", error);
          socket.emit("error", { message: "Failed to join hub" });
        }
      });

      socket.on("leaveHub", async () => {
        if (socket.data.characterId) {
          try {
            // Update character offline status
            await db.character.update({
              where: { id: socket.data.characterId },
              data: { isOnline: false, lastSeen: new Date() },
            });

            // Notify other players
            socket.broadcast.emit("playerLeft", socket.data.characterId);

            this.connectedPlayers.delete(socket.data.characterId);
            console.log(`Character left the hub`);
          } catch (error) {
            console.error("Error leaving hub:", error);
          }
        }
      });

      // Party events
      socket.on("createParty", async (data) => {
        try {
          if (!socket.data.characterId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const character = await db.character.findUnique({
            where: { id: socket.data.characterId },
          });

          if (!character) {
            socket.emit("error", { message: "Character not found" });
            return;
          }

          if (character.partyId) {
            socket.emit("error", { message: "Already in a party" });
            return;
          }

          const party = await db.party.create({
            data: {
              name: data.name,
              isPublic: data.isPublic,
              maxMembers: data.maxMembers,
              leaderId: character.id,
            },
            include: {
              leader: {
                select: { id: true, name: true, level: true, reputation: true },
              },
              members: {
                include: {
                  character: {
                    select: {
                      id: true,
                      name: true,
                      level: true,
                      reputation: true,
                    },
                  },
                },
              },
            },
          });

          // Add leader as first member
          await db.partyMember.create({
            data: {
              partyId: party.id,
              characterId: character.id,
              role: "leader",
              isReady: false,
            },
          });

          // Update character's party
          await db.character.update({
            where: { id: character.id },
            data: { partyId: party.id },
          });

          socket.data.partyId = party.id;
          socket.join(`party:${party.id}`);
          this.partyRooms.set(party.id, new Set([socket.id]));

          socket.emit("partyCreated", party);
          console.log(`Party created: ${party.id}`);
        } catch (error) {
          console.error("Error creating party:", error);
          socket.emit("error", { message: "Failed to create party" });
        }
      });

      socket.on("joinParty", async (partyId) => {
        try {
          if (!socket.data.characterId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const party = await db.party.findUnique({
            where: { id: partyId },
            include: { members: true },
          });

          if (!party) {
            socket.emit("error", { message: "Party not found" });
            return;
          }

          if (party.status !== "FORMING") {
            socket.emit("error", {
              message: "Party is not accepting new members",
            });
            return;
          }

          if (party.members.length >= party.maxMembers) {
            socket.emit("error", { message: "Party is full" });
            return;
          }

          const character = await db.character.findUnique({
            where: { id: socket.data.characterId },
          });

          if (!character) {
            socket.emit("error", { message: "Character not found" });
            return;
          }

          if (character.partyId) {
            socket.emit("error", { message: "Already in a party" });
            return;
          }

          // Add character to party
          await db.partyMember.create({
            data: {
              partyId: partyId,
              characterId: character.id,
              isReady: false,
            },
          });

          // Update character's party
          await db.character.update({
            where: { id: character.id },
            data: { partyId: partyId },
          });

          socket.data.partyId = partyId;
          socket.join(`party:${partyId}`);

          const partyRoom = this.partyRooms.get(partyId) || new Set();
          partyRoom.add(socket.id);
          this.partyRooms.set(partyId, partyRoom);

          // Notify party members
          socket.to(`party:${partyId}`).emit("partyUpdate", {
            partyId,
            members: await this.getPartyMembers(partyId),
            status: party.status,
          });

          socket.emit("partyJoined", { partyId });
          console.log(`Character joined party: ${partyId}`);
        } catch (error) {
          console.error("Error joining party:", error);
          socket.emit("error", { message: "Failed to join party" });
        }
      });

      socket.on("sendPartyMessage", async (messageData) => {
        if (!socket.data.partyId || !socket.data.characterId) {
          socket.emit("error", { message: "Not in a party" });
          return;
        }

        const character = await db.character.findUnique({
          where: { id: socket.data.characterId },
          select: { name: true },
        });

        if (!character) {
          socket.emit("error", { message: "Character not found" });
          return;
        }

        const chatData = {
          message: messageData.message,
          sender: messageData.sender || character.name,
          timestamp: messageData.timestamp || new Date().toISOString(),
        };

        socket.to(`party:${socket.data.partyId}`).emit("partyChat", chatData);
        socket.emit("partyChat", chatData);
      });

      socket.on("disconnect", async () => {
        console.log(`Socket disconnected: ${socket.id}`);

        if (socket.data.characterId) {
          try {
            // Update character offline status
            await db.character.update({
              where: { id: socket.data.characterId },
              data: { isOnline: false, lastSeen: new Date() },
            });

            // Notify other players
            socket.broadcast.emit("playerLeft", socket.data.characterId);

            this.connectedPlayers.delete(socket.data.characterId);
          } catch (error) {
            console.error("Error handling disconnect:", error);
          }
        }
      });
    });
  }

  private async getPartyMembers(partyId: string) {
    const members = await db.partyMember.findMany({
      where: { partyId },
      include: {
        character: {
          select: { id: true, name: true, level: true, reputation: true },
        },
      },
    });

    return members;
  }

  // Public methods for external use
  public emitToParty(partyId: string, event: string, data: any) {
    this.io.to(`party:${partyId}`).emit(event as any, data);
  }

  public emitToCharacter(characterId: string, event: string, data: any) {
    this.io.to(`character:${characterId}`).emit(event as any, data);
  }

  public emitToHub(event: string, data: any) {
    this.io.emit(event as any, data);
  }

  public getConnectedPlayers() {
    return Array.from(this.connectedPlayers.keys());
  }

  public getPartyMembers(partyId: string) {
    const room = this.partyRooms.get(partyId);
    return room ? Array.from(room) : [];
  }
}

export let wsManager: WebSocketManager;

export function initializeWebSocket(server: HTTPServer) {
  wsManager = new WebSocketManager(server);
  return wsManager;
}
