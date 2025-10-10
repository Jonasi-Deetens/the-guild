import { createTRPCRouter } from "@/server/context";
import { characterRouter } from "./character";
import { missionRouter } from "./mission";
import { partyRouter } from "./party";
import { dungeonRouter } from "./dungeon";
import { dungeonEventRouter } from "./dungeonEvent";
import { tradingRouter } from "./trading";
import { theftRouter } from "./theft";
import { reputationRouter } from "./reputation";
import { statisticsRouter } from "./statistics";

export const appRouter = createTRPCRouter({
  character: characterRouter,
  mission: missionRouter,
  party: partyRouter,
  dungeon: dungeonRouter,
  dungeonEvent: dungeonEventRouter,
  trading: tradingRouter,
  theft: theftRouter,
  reputation: reputationRouter,
  statistics: statisticsRouter,
});

export type AppRouter = typeof appRouter;
