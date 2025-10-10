import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://:password@localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Error:", err));

export async function getRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

// Session state keys
export const REDIS_KEYS = {
  activeSession: (sessionId: string) => `session:${sessionId}:active`,
  eventState: (eventId: string) => `event:${eventId}:state`,
  playerPresence: (sessionId: string, characterId: string) =>
    `session:${sessionId}:player:${characterId}:presence`,
  turnTimer: (eventId: string) => `event:${eventId}:timer`,
};

export interface ActiveSessionState {
  sessionId: string;
  currentEventId: string;
  activePlayers: string[]; // characterIds
  turnEndsAt: number; // timestamp
  eventData: any;
}

// Helper functions for Redis operations
export async function setActiveSessionState(
  sessionId: string,
  state: ActiveSessionState,
  ttlSeconds: number = 7200 // 2 hours default
) {
  const redis = await getRedisClient();
  await redis.set(REDIS_KEYS.activeSession(sessionId), JSON.stringify(state), {
    EX: ttlSeconds,
  });
}

export async function getActiveSessionState(
  sessionId: string
): Promise<ActiveSessionState | null> {
  const redis = await getRedisClient();
  const data = await redis.get(REDIS_KEYS.activeSession(sessionId));
  return data ? JSON.parse(data) : null;
}

export async function deleteActiveSessionState(sessionId: string) {
  const redis = await getRedisClient();
  await redis.del(REDIS_KEYS.activeSession(sessionId));
}

export async function setEventTimer(
  eventId: string,
  endTime: number,
  ttlSeconds: number = 300 // 5 minutes default
) {
  const redis = await getRedisClient();
  await redis.set(REDIS_KEYS.turnTimer(eventId), endTime.toString(), {
    EX: ttlSeconds,
  });
}

export async function getEventTimer(eventId: string): Promise<number | null> {
  const redis = await getRedisClient();
  const data = await redis.get(REDIS_KEYS.turnTimer(eventId));
  return data ? parseInt(data) : null;
}

export async function setPlayerPresence(
  sessionId: string,
  characterId: string,
  isActive: boolean = true,
  ttlSeconds: number = 300 // 5 minutes default
) {
  const redis = await getRedisClient();
  const key = REDIS_KEYS.playerPresence(sessionId, characterId);

  if (isActive) {
    await redis.set(key, "active", { EX: ttlSeconds });
  } else {
    await redis.del(key);
  }
}

export async function getPlayerPresence(
  sessionId: string,
  characterId: string
): Promise<boolean> {
  const redis = await getRedisClient();
  const data = await redis.get(
    REDIS_KEYS.playerPresence(sessionId, characterId)
  );
  return data === "active";
}

export async function getActivePlayers(sessionId: string): Promise<string[]> {
  const redis = await getRedisClient();
  const pattern = REDIS_KEYS.playerPresence(sessionId, "*");
  const keys = await redis.keys(pattern);

  const characterIds: string[] = [];
  for (const key of keys) {
    const data = await redis.get(key);
    if (data === "active") {
      // Extract characterId from key pattern
      const match = key.match(/session:([^:]+):player:([^:]+):presence/);
      if (match) {
        characterIds.push(match[2]);
      }
    }
  }

  return characterIds;
}
