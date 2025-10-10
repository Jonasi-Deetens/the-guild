import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/context";
import { dungeonEngine } from "@/server/services/dungeonEngine";

export const dungeonEventRouter = createTRPCRouter({
  // Get current event for a session
  getCurrentEvent: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: input.sessionId },
        include: {
          events: {
            where: { status: "ACTIVE" },
            include: {
              template: true,
              playerActions: {
                include: { character: true },
              },
            },
          },
        },
      });

      return session?.events[0] || null;
    }),

  // Submit action for current event
  submitEventAction: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        actionType: z.string(),
        actionData: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("🎮 tRPC submitEventAction called:", input);

      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        console.log("🎮 Character not found for user:", ctx.session.user.id);
        throw new Error("Character not found");
      }

      console.log("🎮 Found character:", character.id, character.name);

      await dungeonEngine.submitEventAction(
        input.eventId,
        character.id,
        input.actionType,
        input.actionData
      );

      console.log("🎮 submitEventAction completed successfully");
      return { success: true };
    }),

  // Get timeline for a session
  getTimeline: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.dungeonSession.findUnique({
        where: { id: input.sessionId },
        select: { timeline: true, currentEventId: true },
      });

      if (!session) throw new Error("Session not found");

      const events = await ctx.db.dungeonEvent.findMany({
        where: { sessionId: input.sessionId },
        include: { template: true, playerActions: true },
        orderBy: { eventNumber: "asc" },
      });

      return {
        timeline: session.timeline,
        currentEventId: session.currentEventId,
        events,
      };
    }),

  // Get event details
  getEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.dungeonEvent.findUnique({
        where: { id: input.eventId },
        include: {
          template: true,
          playerActions: {
            include: { character: true },
          },
          childEvents: {
            include: { template: true },
          },
        },
      });
    }),

  // Get player's action status for an event
  getPlayerActionStatus: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) throw new Error("Character not found");

      const action = await ctx.db.dungeonPlayerAction.findUnique({
        where: {
          eventId_characterId: {
            eventId: input.eventId,
            characterId: character.id,
          },
        },
      });

      return {
        hasSubmitted: !!action,
        action,
      };
    }),

  // Get current character stats for a session
  getCharacterStats: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
        select: {
          id: true,
          name: true,
          health: true,
          maxHealth: true,
          attack: true,
          defense: true,
          speed: true,
          perception: true,
          gold: true,
          experience: true,
        },
      });
      return character;
    }),

  // Get event templates (for admin/dev purposes)
  getEventTemplates: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        difficulty: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.eventTemplate.findMany({
        where: {
          type: input.type as any,
          difficulty: input.difficulty ? { lte: input.difficulty } : undefined,
        },
      });
    }),
});
