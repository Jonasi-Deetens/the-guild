import { createTRPCRouter } from "@/server/context";
import { characterRouter } from "./character";
import { missionRouter } from "./mission";
import { partyRouter } from "./party";
import { dungeonRouter } from "./dungeon";
import { tradingRouter } from "./trading";
import { theftRouter } from "./theft";
import { reputationRouter } from "./reputation";

export const appRouter = createTRPCRouter({
  character: characterRouter,
  mission: missionRouter,
  party: partyRouter,
  dungeon: dungeonRouter,
  trading: tradingRouter,
  theft: theftRouter,
  reputation: reputationRouter,
});

export type AppRouter = typeof appRouter;
