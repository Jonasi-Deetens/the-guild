import { createTRPCRouter } from "@/server/context";
import { characterRouter } from "./character";
import { missionRouter } from "./mission";
import { partyRouter } from "./party";
import { dungeonRouter } from "./dungeon";
import { lootDistributionRouter } from "./lootDistribution";
import { tradingRouter } from "./trading";
import { theftRouter } from "./theft";
import { reputationRouter } from "./reputation";
import { statisticsRouter } from "./statistics";
import { monsterRouter } from "./monster";
import { npcRouter } from "./npc";
import { phaseRouter } from "./phase";

export const appRouter = createTRPCRouter({
  character: characterRouter,
  mission: missionRouter,
  party: partyRouter,
  dungeon: dungeonRouter,
  lootDistribution: lootDistributionRouter,
  trading: tradingRouter,
  theft: theftRouter,
  reputation: reputationRouter,
  statistics: statisticsRouter,
  monster: monsterRouter,
  npc: npcRouter,
  phase: phaseRouter,
});

export type AppRouter = typeof appRouter;
