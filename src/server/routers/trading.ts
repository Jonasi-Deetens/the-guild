import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";

export const tradingRouter = createTRPCRouter({
  // Create a trade request
  createTradeRequest: protectedProcedure
    .input(
      z.object({
        targetId: z.string(),
        offeredItems: z.array(
          z.object({
            itemId: z.string(),
            quantity: z.number().min(1),
          })
        ),
        offeredGold: z.number().min(0),
        requestedItems: z.array(
          z.object({
            itemId: z.string(),
            quantity: z.number().min(1),
          })
        ),
        requestedGold: z.number().min(0),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check if target character exists
      const targetCharacter = await ctx.db.character.findUnique({
        where: { id: input.targetId },
      });

      if (!targetCharacter) {
        throw new Error("Target character not found");
      }

      // Check if character has enough gold
      if (character.gold < input.offeredGold) {
        throw new Error("Insufficient gold");
      }

      // Check if character has the offered items
      for (const item of input.offeredItems) {
        const inventory = await ctx.db.inventory.findFirst({
          where: {
            characterId: character.id,
            itemId: item.itemId,
            quantity: { gte: item.quantity },
          },
        });

        if (!inventory) {
          throw new Error(`Insufficient quantity of item ${item.itemId}`);
        }
      }

      // Create trade request
      const tradeRequest = await ctx.db.tradeRequest.create({
        data: {
          fromCharacterId: character.id,
          toCharacterId: input.targetId,
          offeredItems: input.offeredItems,
          offeredGold: input.offeredGold,
          requestedItems: input.requestedItems,
          requestedGold: input.requestedGold,
          message: input.message,
          status: "PENDING",
        },
        include: {
          fromCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
          toCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
        },
      });

      return tradeRequest;
    }),

  // Get trade requests for a character
  getTradeRequests: protectedProcedure
    .input(
      z.object({
        type: z.enum(["sent", "received"]).default("received"),
        status: z
          .enum(["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      const where =
        input.type === "sent"
          ? { fromCharacterId: character.id }
          : { toCharacterId: character.id };

      if (input.status) {
        where.status = input.status;
      }

      return await ctx.db.tradeRequest.findMany({
        where,
        include: {
          fromCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
          toCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Accept a trade request
  acceptTrade: protectedProcedure
    .input(z.object({ tradeRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      const tradeRequest = await ctx.db.tradeRequest.findUnique({
        where: { id: input.tradeRequestId },
        include: {
          fromCharacter: true,
          toCharacter: true,
        },
      });

      if (!tradeRequest) {
        throw new Error("Trade request not found");
      }

      if (tradeRequest.toCharacterId !== character.id) {
        throw new Error("You can only accept trade requests sent to you");
      }

      if (tradeRequest.status !== "PENDING") {
        throw new Error("Trade request is not pending");
      }

      // Check if target character has enough gold
      if (tradeRequest.toCharacter.gold < tradeRequest.requestedGold) {
        throw new Error("Insufficient gold");
      }

      // Check if target character has the requested items
      for (const item of tradeRequest.requestedItems) {
        const inventory = await ctx.db.inventory.findFirst({
          where: {
            characterId: tradeRequest.toCharacterId,
            itemId: item.itemId,
            quantity: { gte: item.quantity },
          },
        });

        if (!inventory) {
          throw new Error(`Insufficient quantity of item ${item.itemId}`);
        }
      }

      // Update trade request status
      await ctx.db.tradeRequest.update({
        where: { id: input.tradeRequestId },
        data: { status: "ACCEPTED" },
      });

      return { success: true };
    }),

  // Reject a trade request
  rejectTrade: protectedProcedure
    .input(z.object({ tradeRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      const tradeRequest = await ctx.db.tradeRequest.findUnique({
        where: { id: input.tradeRequestId },
      });

      if (!tradeRequest) {
        throw new Error("Trade request not found");
      }

      if (tradeRequest.toCharacterId !== character.id) {
        throw new Error("You can only reject trade requests sent to you");
      }

      if (tradeRequest.status !== "PENDING") {
        throw new Error("Trade request is not pending");
      }

      // Update trade request status
      await ctx.db.tradeRequest.update({
        where: { id: input.tradeRequestId },
        data: { status: "REJECTED" },
      });

      return { success: true };
    }),

  // Complete a trade (execute the exchange)
  completeTrade: protectedProcedure
    .input(z.object({ tradeRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      const tradeRequest = await ctx.db.tradeRequest.findUnique({
        where: { id: input.tradeRequestId },
        include: {
          fromCharacter: true,
          toCharacter: true,
        },
      });

      if (!tradeRequest) {
        throw new Error("Trade request not found");
      }

      if (tradeRequest.status !== "ACCEPTED") {
        throw new Error("Trade request must be accepted before completion");
      }

      // Check if either character can complete the trade
      if (
        tradeRequest.fromCharacterId !== character.id &&
        tradeRequest.toCharacterId !== character.id
      ) {
        throw new Error("You can only complete trades you're involved in");
      }

      // Execute the trade
      await ctx.db.$transaction(async (tx) => {
        // Transfer gold
        await tx.character.update({
          where: { id: tradeRequest.fromCharacterId },
          data: { gold: { decrement: tradeRequest.offeredGold } },
        });

        await tx.character.update({
          where: { id: tradeRequest.toCharacterId },
          data: { gold: { increment: tradeRequest.offeredGold } },
        });

        await tx.character.update({
          where: { id: tradeRequest.fromCharacterId },
          data: { gold: { increment: tradeRequest.requestedGold } },
        });

        await tx.character.update({
          where: { id: tradeRequest.toCharacterId },
          data: { gold: { decrement: tradeRequest.requestedGold } },
        });

        // Transfer items from sender to receiver
        for (const item of tradeRequest.offeredItems) {
          // Remove from sender
          await tx.inventory.updateMany({
            where: {
              characterId: tradeRequest.fromCharacterId,
              itemId: item.itemId,
            },
            data: { quantity: { decrement: item.quantity } },
          });

          // Add to receiver
          const existingInventory = await tx.inventory.findFirst({
            where: {
              characterId: tradeRequest.toCharacterId,
              itemId: item.itemId,
            },
          });

          if (existingInventory) {
            await tx.inventory.update({
              where: { id: existingInventory.id },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            await tx.inventory.create({
              data: {
                characterId: tradeRequest.toCharacterId,
                itemId: item.itemId,
                quantity: item.quantity,
              },
            });
          }
        }

        // Transfer items from receiver to sender
        for (const item of tradeRequest.requestedItems) {
          // Remove from receiver
          await tx.inventory.updateMany({
            where: {
              characterId: tradeRequest.toCharacterId,
              itemId: item.itemId,
            },
            data: { quantity: { decrement: item.quantity } },
          });

          // Add to sender
          const existingInventory = await tx.inventory.findFirst({
            where: {
              characterId: tradeRequest.fromCharacterId,
              itemId: item.itemId,
            },
          });

          if (existingInventory) {
            await tx.inventory.update({
              where: { id: existingInventory.id },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            await tx.inventory.create({
              data: {
                characterId: tradeRequest.fromCharacterId,
                itemId: item.itemId,
                quantity: item.quantity,
              },
            });
          }
        }

        // Update trade request status
        await tx.tradeRequest.update({
          where: { id: input.tradeRequestId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        // Create transaction log entries
        await tx.transaction.create({
          data: {
            actorId: tradeRequest.fromCharacterId,
            targetId: tradeRequest.toCharacterId,
            type: "TRADE",
            amount: tradeRequest.offeredGold,
            description: `Traded ${tradeRequest.offeredGold} gold and items for ${tradeRequest.requestedGold} gold and items`,
            metadata: {
              tradeRequestId: input.tradeRequestId,
              offeredItems: tradeRequest.offeredItems,
              requestedItems: tradeRequest.requestedItems,
            },
          },
        });

        await tx.transaction.create({
          data: {
            actorId: tradeRequest.toCharacterId,
            targetId: tradeRequest.fromCharacterId,
            type: "TRADE",
            amount: tradeRequest.requestedGold,
            description: `Traded ${tradeRequest.requestedGold} gold and items for ${tradeRequest.offeredGold} gold and items`,
            metadata: {
              tradeRequestId: input.tradeRequestId,
              offeredItems: tradeRequest.requestedItems,
              requestedItems: tradeRequest.offeredItems,
            },
          },
        });
      });

      return { success: true };
    }),

  // Get trade history
  getTradeHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await ctx.db.tradeRequest.findMany({
        where: {
          OR: [
            { fromCharacterId: character.id },
            { toCharacterId: character.id },
          ],
          status: "COMPLETED",
        },
        include: {
          fromCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
          toCharacter: {
            select: { id: true, name: true, level: true, reputation: true },
          },
        },
        orderBy: { completedAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),
});
