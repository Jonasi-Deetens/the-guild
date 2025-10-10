import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";
import { statisticsService } from "@/server/services/statisticsService";

export const characterRouter = createTRPCRouter({
  // Get current character
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        inventory: {
          include: {
            item: true,
          },
        },
        party: {
          include: {
            members: {
              include: {
                character: true,
              },
            },
          },
        },
      },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return character;
  }),

  // Create new character
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if character already exists
      const existingCharacter = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (existingCharacter) {
        throw new Error("Character already exists");
      }

      // Check if name is taken
      const nameTaken = await ctx.db.character.findUnique({
        where: { name: input.name },
      });

      if (nameTaken) {
        throw new Error("Character name already taken");
      }

      const character = await ctx.db.character.create({
        data: {
          name: input.name,
          userId: ctx.session.user.id,
        },
        include: {
          inventory: {
            include: {
              item: true,
            },
          },
        },
      });

      // Initialize character statistics
      await statisticsService.initializeCharacterStatistics(character.id);

      return character;
    }),

  // Update character online status
  updateOnlineStatus: protectedProcedure
    .input(z.object({ isOnline: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await ctx.db.character.update({
        where: { id: character.id },
        data: {
          isOnline: input.isOnline,
          lastSeen: new Date(),
        },
      });
    }),

  // Get online characters
  getOnline: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.character.findMany({
      where: { isOnline: true },
      select: {
        id: true,
        name: true,
        level: true,
        reputation: true,
        gold: true,
        lastSeen: true,
      },
      orderBy: { lastSeen: "desc" },
    });
  }),

  // Get character by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.character.findUnique({
        where: { id: input.id },
        include: {
          inventory: {
            include: {
              item: true,
            },
          },
        },
      });
    }),

  // Get experience requirements for leveling
  getExperienceInfo: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      select: { level: true, experience: true },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    const currentLevel = character.level;
    const currentExp = character.experience;

    // Calculate experience required for current level
    const currentLevelExp = Math.pow(currentLevel - 1, 2) * 100;
    const nextLevelExp = Math.pow(currentLevel, 2) * 100;
    const expToNext = nextLevelExp - currentExp;
    const expProgress = currentExp - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;

    return {
      currentLevel,
      currentExperience: currentExp,
      experienceToNext: expToNext,
      experienceProgress: expProgress,
      experienceNeeded: expNeeded,
      progressPercentage: Math.round((expProgress / expNeeded) * 100),
    };
  }),

  // Get character inventory
  getInventory: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        inventory: {
          include: {
            item: true,
          },
          orderBy: [{ equipped: "desc" }, { item: { name: "asc" } }],
        },
      },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return character.inventory;
  }),

  // Use an item from inventory
  useItem: protectedProcedure
    .input(z.object({ inventoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inventoryItem = await ctx.db.inventory.findUnique({
        where: { id: input.inventoryId },
        include: {
          item: true,
          character: true,
        },
      });

      if (!inventoryItem) {
        throw new Error("Item not found in inventory");
      }

      if (inventoryItem.character.userId !== ctx.session.user.id) {
        throw new Error("You don't own this item");
      }

      const { item } = inventoryItem;

      // Handle different item types
      if (item.type === "CONSUMABLE" && item.healing) {
        // Heal the character
        const newHealth = Math.min(
          inventoryItem.character.maxHealth,
          inventoryItem.character.health + item.healing
        );

        await ctx.db.character.update({
          where: { id: inventoryItem.characterId },
          data: { health: newHealth },
        });

        // Remove item from inventory
        if (inventoryItem.quantity > 1) {
          await ctx.db.inventory.update({
            where: { id: input.inventoryId },
            data: { quantity: { decrement: 1 } },
          });
        } else {
          await ctx.db.inventory.delete({
            where: { id: input.inventoryId },
          });
        }

        return {
          success: true,
          message: `Used ${item.name} and healed ${item.healing} health!`,
          newHealth,
        };
      }

      throw new Error("This item cannot be used");
    }),

  // Equip/unequip an item
  toggleEquip: protectedProcedure
    .input(z.object({ inventoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inventoryItem = await ctx.db.inventory.findUnique({
        where: { id: input.inventoryId },
        include: {
          item: true,
          character: true,
        },
      });

      if (!inventoryItem) {
        throw new Error("Item not found in inventory");
      }

      if (inventoryItem.character.userId !== ctx.session.user.id) {
        throw new Error("You don't own this item");
      }

      const { item } = inventoryItem;

      // Only weapons and armor can be equipped
      if (item.type !== "WEAPON" && item.type !== "ARMOR") {
        throw new Error("This item cannot be equipped");
      }

      // If equipping, unequip other items of the same type
      if (!inventoryItem.equipped) {
        await ctx.db.inventory.updateMany({
          where: {
            characterId: inventoryItem.characterId,
            item: { type: item.type },
            equipped: true,
          },
          data: { equipped: false },
        });
      }

      // Toggle equipped status
      const updatedItem = await ctx.db.inventory.update({
        where: { id: input.inventoryId },
        data: { equipped: !inventoryItem.equipped },
        include: { item: true },
      });

      return {
        success: true,
        message: `${updatedItem.equipped ? "Equipped" : "Unequipped"} ${
          item.name
        }`,
        equipped: updatedItem.equipped,
      };
    }),

  // Give starting items to new character
  giveStartingItems: protectedProcedure.mutation(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      include: { inventory: true },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    // Check if character already has items
    if (character.inventory.length > 0) {
      throw new Error("Character already has items");
    }

    // Import dungeonEngine to use the giveStartingItems method
    const { dungeonEngine } = await import("@/server/services/dungeonEngine");

    const result = await dungeonEngine.giveStartingItems(character.id);
    return result;
  }),
});
