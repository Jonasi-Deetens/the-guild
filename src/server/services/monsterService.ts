import { db } from "@/lib/db";

export interface MonsterInstance {
  id: string;
  templateId: string;
  name: string;
  type: string;
  rarity: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  attackInterval: number;
  nextAttackTime: number;
  abilities?: any;
  description?: string;
}

export class MonsterService {
  /**
   * Generate a monster instance from a template ID
   */
  static async generateMonsterFromTemplate(
    templateId: string
  ): Promise<MonsterInstance | null> {
    try {
      const template = await db.monsterTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        console.error(`❌ [MonsterService] Template not found: ${templateId}`);
        return null;
      }

      // Calculate rarity and stat multipliers
      const rarityRoll = Math.random();
      let rarity = "COMMON";
      let healthMultiplier = 1;
      let attackMultiplier = 1;
      let defenseMultiplier = 1;

      if (rarityRoll < 0.05) {
        // 5% chance for BOSS
        rarity = "BOSS";
        healthMultiplier = 2.5;
        attackMultiplier = 2.0;
        defenseMultiplier = 1.8;
      } else if (rarityRoll < 0.15) {
        // 10% chance for RARE
        rarity = "RARE";
        healthMultiplier = 1.8;
        attackMultiplier = 1.6;
        defenseMultiplier = 1.4;
      } else if (rarityRoll < 0.35) {
        // 20% chance for ELITE
        rarity = "ELITE";
        healthMultiplier = 1.4;
        attackMultiplier = 1.3;
        defenseMultiplier = 1.2;
      }

      // Apply stat multipliers
      const health = Math.floor(template.baseHealth * healthMultiplier);
      const attack = Math.floor(template.baseAttack * attackMultiplier);
      const defense = Math.floor(template.baseDefense * defenseMultiplier);

      // Calculate attack interval (base 4 seconds, modified by attackSpeed)
      const baseInterval = 4000; // 4 seconds in milliseconds
      const attackInterval = Math.floor(baseInterval / template.attackSpeed);

      // Add stagger to prevent all monsters attacking at once
      const staggerOffset = Math.floor(Math.random() * 2000); // 0-2 seconds

      const monster: MonsterInstance = {
        id: `monster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

      console.log(
        `✅ [MonsterService] Generated monster: ${monster.name} (${monster.rarity})`
      );
      return monster;
    } catch (error) {
      console.error(
        `❌ [MonsterService] Error generating monster from template ${templateId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Generate multiple monsters from template IDs
   */
  static async generateMonstersFromTemplates(
    templateIds: string[]
  ): Promise<MonsterInstance[]> {
    const monsters: MonsterInstance[] = [];

    for (const templateId of templateIds) {
      const monster = await this.generateMonsterFromTemplate(templateId);
      if (monster) {
        monsters.push(monster);
      }
    }

    return monsters;
  }

  /**
   * Get monster template by ID
   */
  static async getTemplateById(templateId: string) {
    return await db.monsterTemplate.findUnique({
      where: { id: templateId },
    });
  }

  /**
   * Get multiple monster templates by IDs
   */
  static async getTemplatesByIds(templateIds: string[]) {
    return await db.monsterTemplate.findMany({
      where: {
        id: {
          in: templateIds,
        },
      },
    });
  }
}
