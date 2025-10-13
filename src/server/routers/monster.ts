import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/context";
import { db } from "@/lib/db";

export const monsterRouter = createTRPCRouter({
  getTemplates: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ input }) => {
      const templates = await db.monsterTemplate.findMany({
        where: {
          id: {
            in: input.ids,
          },
        },
      });
      return templates;
    }),

  getAllTemplates: publicProcedure.query(async () => {
    const templates = await db.monsterTemplate.findMany({
      orderBy: [{ type: "asc" }, { rarity: "asc" }, { name: "asc" }],
    });
    return templates;
  }),

  getTemplatesByType: publicProcedure
    .input(
      z.object({
        type: z.enum([
          "WARRIOR",
          "RANGER",
          "MAGE",
          "HEALER",
          "TANK",
          "BERSERKER",
        ]),
      })
    )
    .query(async ({ input }) => {
      const templates = await db.monsterTemplate.findMany({
        where: {
          type: input.type,
        },
        orderBy: [{ rarity: "asc" }, { name: "asc" }],
      });
      return templates;
    }),

  generateCombatMonsters: publicProcedure
    .input(
      z.object({
        templateIds: z.array(z.string()),
        minMonsters: z.number().min(1).max(10),
        maxMonsters: z.number().min(1).max(10),
        eliteChance: z.number().min(0).max(1),
        specialAbilityChance: z.number().min(0).max(1),
      })
    )
    .query(async ({ input }) => {
      console.log(
        "🔍 [MonsterRouter] generateCombatMonsters called with:",
        input
      );

      // Fetch monster templates
      const templates = await db.monsterTemplate.findMany({
        where: {
          id: {
            in: input.templateIds,
          },
        },
      });

      console.log(
        "🔍 [MonsterRouter] Found templates:",
        templates.map((t) => ({
          id: t.id,
          name: t.name,
          rarity: t.rarity,
        }))
      );

      if (templates.length === 0) {
        throw new Error("No monster templates found for the provided IDs");
      }

      // Determine number of monsters to spawn
      const monsterCount = Math.floor(
        Math.random() * (input.maxMonsters - input.minMonsters + 1) +
          input.minMonsters
      );

      console.log("🔍 [MonsterRouter] Monster count calculation:", {
        minMonsters: input.minMonsters,
        maxMonsters: input.maxMonsters,
        calculatedCount: monsterCount,
        randomValue: Math.random(),
      });

      // Generate monster instances
      const monsters = [];
      for (let i = 0; i < monsterCount; i++) {
        // Pick a random template
        const template =
          templates[Math.floor(Math.random() * templates.length)];

        // Determine if this monster should be elite
        const isElite = Math.random() < input.eliteChance;
        const isRare = Math.random() < input.specialAbilityChance;

        // Calculate stats based on rarity
        let healthMultiplier = 1;
        let attackMultiplier = 1;
        let defenseMultiplier = 1;
        let rarity = "COMMON";

        if (isElite) {
          healthMultiplier = 1.5;
          attackMultiplier = 1.5;
          defenseMultiplier = 1.5;
          rarity = "ELITE";
        } else if (isRare) {
          healthMultiplier = 2.0;
          attackMultiplier = 2.0;
          defenseMultiplier = 2.0;
          rarity = "RARE";
        }

        // Calculate final stats
        const health = Math.floor(template.baseHealth * healthMultiplier);
        const attack = Math.floor(template.baseAttack * attackMultiplier);
        const defense = Math.floor(template.baseDefense * defenseMultiplier);

        // Calculate attack interval (base 4 seconds, modified by attackSpeed)
        const baseInterval = 4000; // 4 seconds in milliseconds
        const attackInterval = Math.floor(baseInterval / template.attackSpeed);

        // Add stagger to prevent all monsters attacking at once
        const staggerOffset = Math.floor(Math.random() * 2000); // 0-2 seconds

        const monster = {
          id: `monster-${i}-${Date.now()}`,
          templateId: template.id,
          name: template.name,
          type: template.type,
          rarity,
          health,
          maxHealth: health,
          attack,
          defense,
          attackInterval,
          nextAttackTime: Date.now() + attackInterval + staggerOffset,
          abilities: template.abilities || null,
          description: template.description,
        };

        monsters.push(monster);
      }

      return monsters;
    }),

  getTemplateById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const template = await db.monsterTemplate.findUnique({
        where: {
          id: input.id,
        },
      });
      return template;
    }),
});
