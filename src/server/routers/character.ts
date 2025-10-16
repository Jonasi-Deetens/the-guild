import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/context";
import { statisticsService } from "@/server/services/statisticsService";
import { GoldService } from "@/server/services/goldService";
import { EquipmentService } from "@/server/services/equipmentService";
import { EquipmentSlot } from "@prisma/client";
import {
  getStatPointsPerLevel,
  validateStatAllocations,
  calculatePendingLevels,
  calculateLevelFromExperience,
  getExperienceForLevel,
  getMaxLevel,
} from "@/lib/utils/experience";

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

  getCurrentCharacter: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        level: true,
        currentHealth: true,
        maxHealth: true,
        attack: true,
        defense: true,
        speed: true,
        perception: true,
        experience: true,
        gold: true,
      },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return character;
  }),

  // Get gold amount from inventory
  getGoldAmount: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return await GoldService.getGoldAmount(character.id);
  }),

  // Update character health (for real-time combat updates)
  updateHealth: protectedProcedure
    .input(
      z.object({
        characterId: z.string(),
        newHealth: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the character belongs to the current user
      const character = await ctx.db.character.findFirst({
        where: {
          id: input.characterId,
          userId: ctx.session.user.id,
        },
      });

      if (!character) {
        throw new Error("Character not found or access denied");
      }

      // Update the character's health
      const updatedCharacter = await ctx.db.character.update({
        where: { id: input.characterId },
        data: { currentHealth: input.newHealth },
        select: {
          id: true,
          name: true,
          currentHealth: true,
          maxHealth: true,
        },
      });

      return updatedCharacter;
    }),

  // Rest to restore health
  rest: protectedProcedure
    .input(
      z.object({
        restType: z.enum(["quick", "full"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check if character is already at full health
      if (character.currentHealth >= character.maxHealth) {
        throw new Error("Character is already at full health");
      }

      let healthRestored = 0;
      let goldCost = 0;

      if (input.restType === "quick") {
        // Quick rest: restore 50% health instantly, costs 10 gold
        healthRestored = Math.floor(
          (character.maxHealth - character.currentHealth) * 0.5
        );
        goldCost = 10;
      } else if (input.restType === "full") {
        // Full rest: restore 100% health, costs 25 gold
        healthRestored = character.maxHealth - character.currentHealth;
        goldCost = 25;
      }

      // Check if character has enough gold
      if (!(await GoldService.hasEnoughGold(character.id, goldCost))) {
        const currentGold = await GoldService.getGoldAmount(character.id);
        throw new Error(
          `Not enough gold. Need ${goldCost} gold for ${input.restType} rest. You have ${currentGold} gold.`
        );
      }

      // Apply rest
      const updatedCharacter = await ctx.db.character.update({
        where: { userId: ctx.session.user.id },
        data: {
          currentHealth: Math.min(
            character.maxHealth,
            character.currentHealth + healthRestored
          ),
        },
      });

      // Remove gold using GoldService
      await GoldService.removeGold(character.id, goldCost);

      // Get current gold amount from inventory
      const currentGold = await GoldService.getGoldAmount(character.id);

      return {
        healthRestored,
        goldCost,
        newHealth: updatedCharacter.currentHealth,
        newGold: currentGold,
      };
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
          inventoryItem.character.currentHealth + item.healing
        );

        await ctx.db.character.update({
          where: { id: inventoryItem.characterId },
          data: { currentHealth: newHealth },
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

      // Check if item can be equipped
      if (!item.equipmentSlot) {
        throw new Error("This item cannot be equipped");
      }

      if (inventoryItem.equipped) {
        // Unequip the item
        await EquipmentService.unequipItem(
          inventoryItem.characterId,
          item.equipmentSlot
        );
        return {
          success: true,
          message: `Unequipped ${item.name}`,
          equipped: false,
        };
      } else {
        // Equip the item
        const result = await EquipmentService.equipItem(
          inventoryItem.characterId,
          item.id
        );
        if (!result.success) {
          throw new Error(result.message);
        }
        return {
          ...result,
          equipped: true,
        };
      }
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

  // Level up character with stat allocation
  levelUp: protectedProcedure
    .input(
      z.object({
        statAllocations: z.object({
          maxHealth: z.number().min(0),
          attack: z.number().min(0),
          defense: z.number().min(0),
          speed: z.number().min(0),
          perception: z.number().min(0),
          agility: z.number().min(0),
          criticalChance: z.number().min(0),
          blockStrength: z.number().min(0),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
        include: {
          party: true,
        },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      // Check if character is at max level
      if (character.level >= getMaxLevel()) {
        throw new Error("Character is already at max level");
      }

      // Check if character has pending stat points
      if (character.pendingStatPoints < getStatPointsPerLevel()) {
        throw new Error("Not enough stat points to level up");
      }

      // Check if character is in an active dungeon (prevent leveling during dungeon)
      const activeDungeon = await ctx.db.dungeonSession.findFirst({
        where: {
          party: {
            members: {
              some: {
                characterId: character.id,
              },
            },
          },
          status: "ACTIVE",
        },
      });

      if (activeDungeon) {
        throw new Error(
          "Cannot level up during an active dungeon. Return to the hub first."
        );
      }

      // Validate stat allocations
      const validation = validateStatAllocations(input.statAllocations);
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid stat allocations");
      }

      // Calculate new level
      const newLevel = character.level + 1;

      // Apply stat increases
      const updatedCharacter = await ctx.db.character.update({
        where: { id: character.id },
        data: {
          level: newLevel,
          pendingStatPoints:
            character.pendingStatPoints - getStatPointsPerLevel(),
          maxHealth: { increment: input.statAllocations.maxHealth },
          currentHealth: { increment: input.statAllocations.maxHealth }, // Also heal
          attack: { increment: input.statAllocations.attack },
          defense: { increment: input.statAllocations.defense },
          speed: { increment: input.statAllocations.speed },
          perception: { increment: input.statAllocations.perception },
          agility: { increment: input.statAllocations.agility },
          criticalChance: {
            increment: input.statAllocations.criticalChance * 0.01,
          }, // Convert to decimal
          blockStrength: { increment: input.statAllocations.blockStrength },
        },
      });

      return {
        success: true,
        character: updatedCharacter,
        statIncreases: input.statAllocations,
      };
    }),

  // Check if character can level up
  canLevelUp: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      select: {
        id: true,
        level: true,
        experience: true,
        pendingStatPoints: true,
      },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    // Calculate what level the character should be based on their experience
    const correctLevel = calculateLevelFromExperience(character.experience);
    const pendingLevels = Math.max(0, correctLevel - character.level);
    const canLevelUp = pendingLevels > 0 && character.level < getMaxLevel();

    // Calculate what the pending stat points should be
    const expectedPendingStatPoints = pendingLevels * getStatPointsPerLevel();

    // Calculate XP requirements for next level
    const nextLevelExp = getExperienceForLevel(character.level + 1);
    const xpNeeded = nextLevelExp - character.experience;

    console.log("🔍 [canLevelUp] Character state:", {
      characterId: character.id,
      currentLevel: character.level,
      correctLevel,
      experience: character.experience,
      nextLevelExp,
      xpNeeded,
      pendingLevels,
      currentPendingStatPoints: character.pendingStatPoints,
      expectedPendingStatPoints,
      canLevelUp,
    });

    // If the character has pending levels but incorrect stat points, fix it
    if (
      pendingLevels > 0 &&
      character.pendingStatPoints !== expectedPendingStatPoints
    ) {
      console.log("🔧 Fixing incorrect pending stat points:", {
        characterId: character.id,
        pendingLevels,
        expectedPendingStatPoints,
        currentPendingStatPoints: character.pendingStatPoints,
      });

      // Update the character with the correct pending stat points
      await ctx.db.character.update({
        where: { id: character.id },
        data: {
          pendingStatPoints: expectedPendingStatPoints,
        },
      });

      return {
        canLevelUp,
        pendingLevels,
        pendingStatPoints: expectedPendingStatPoints,
        isMaxLevel: character.level >= getMaxLevel(),
      };
    }

    // Special case: if character has exactly enough XP for next level but no pending levels
    // This can happen if the character's level in DB is outdated
    if (
      pendingLevels === 0 &&
      character.experience >= nextLevelExp &&
      character.level < getMaxLevel()
    ) {
      console.log(
        "🔧 Character has enough XP but no pending levels - fixing level:",
        {
          characterId: character.id,
          currentLevel: character.level,
          experience: character.experience,
          nextLevelExp,
          correctLevel,
        }
      );

      // Update the character's level to match their experience
      await ctx.db.character.update({
        where: { id: character.id },
        data: {
          level: correctLevel,
          pendingStatPoints: 0, // Reset pending stat points since they should have been used
        },
      });

      return {
        canLevelUp: false, // No more levels to gain
        pendingLevels: 0,
        pendingStatPoints: 0,
        isMaxLevel: correctLevel >= getMaxLevel(),
      };
    }

    return {
      canLevelUp,
      pendingLevels,
      pendingStatPoints: character.pendingStatPoints,
      isMaxLevel: character.level >= getMaxLevel(),
    };
  }),

  // Equipment-related endpoints
  equipItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      return await EquipmentService.equipItem(character.id, input.itemId);
    }),

  unequipItem: protectedProcedure
    .input(z.object({ slot: z.nativeEnum(EquipmentSlot) }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });

      if (!character) {
        throw new Error("Character not found");
      }

      await EquipmentService.unequipItem(character.id, input.slot);
      return { success: true, message: "Item unequipped successfully" };
    }),

  getEquipment: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return await EquipmentService.getEquippedItems(character.id);
  }),

  getCalculatedStats: protectedProcedure.query(async ({ ctx }) => {
    const character = await ctx.db.character.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    });

    if (!character) {
      throw new Error("Character not found");
    }

    return await EquipmentService.calculateStats(character.id);
  }),
});
