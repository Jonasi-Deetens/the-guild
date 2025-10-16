import { EquipmentSlot } from "@prisma/client";
import {
  Sword,
  Shield,
  Heart,
  Zap,
  Eye,
  Crown,
  Package,
  Star,
} from "@/components/icons";

/**
 * Get the appropriate icon for an equipment slot
 */
export function getSlotIcon(slot: EquipmentSlot) {
  switch (slot) {
    case EquipmentSlot.WEAPON:
      return <Sword className="h-6 w-6 text-orange-400" />;
    case EquipmentSlot.OFF_HAND:
      return <Shield className="h-6 w-6 text-blue-400" />;
    case EquipmentSlot.HEAD:
      return <Crown className="h-6 w-6 text-purple-400" />;
    case EquipmentSlot.CHEST:
      return <Package className="h-6 w-6 text-green-400" />;
    case EquipmentSlot.LEGS:
      return <Package className="h-6 w-6 text-green-400" />;
    case EquipmentSlot.BOOTS:
      return <Package className="h-6 w-6 text-green-400" />;
    case EquipmentSlot.GLOVES:
      return <Package className="h-6 w-6 text-green-400" />;
    case EquipmentSlot.RING:
      return <Star className="h-6 w-6 text-yellow-400" />;
    case EquipmentSlot.AMULET:
      return <Heart className="h-6 w-6 text-red-400" />;
    default:
      return <Package className="h-6 w-6 text-gray-400" />;
  }
}

/**
 * Get the display name for an equipment slot
 */
export function getSlotName(slot: EquipmentSlot): string {
  switch (slot) {
    case EquipmentSlot.WEAPON:
      return "Weapon";
    case EquipmentSlot.OFF_HAND:
      return "Off-hand";
    case EquipmentSlot.HEAD:
      return "Head";
    case EquipmentSlot.CHEST:
      return "Chest";
    case EquipmentSlot.LEGS:
      return "Legs";
    case EquipmentSlot.BOOTS:
      return "Boots";
    case EquipmentSlot.GLOVES:
      return "Gloves";
    case EquipmentSlot.RING:
      return "Ring";
    case EquipmentSlot.AMULET:
      return "Amulet";
    default:
      return "Unknown";
  }
}

/**
 * Format stat bonus display (e.g., "+10 ATK (+5%)")
 */
export function formatStatBonus(stat: number, percent: number): string {
  if (stat === 0 && percent === 0) return "";

  let result = "";
  if (stat > 0) {
    result += `+${stat}`;
  } else if (stat < 0) {
    result += `${stat}`;
  }

  if (percent > 0) {
    if (result) result += " ";
    result += `(+${Math.round(percent * 100)}%)`;
  } else if (percent < 0) {
    if (result) result += " ";
    result += `(${Math.round(percent * 100)}%)`;
  }

  return result;
}

/**
 * Check if character meets item requirements (client-side)
 */
export function meetsRequirements(
  character: any,
  item: any
): { meets: boolean; reason?: string } {
  // Check level requirement
  if (character.level < item.levelRequirement) {
    return {
      meets: false,
      reason: `Requires level ${item.levelRequirement} (you are level ${character.level})`,
    };
  }

  // Check stat requirements (using base stats, not equipped stats)
  if (character.attack < item.attackRequirement) {
    return {
      meets: false,
      reason: `Requires ${item.attackRequirement} attack (you have ${character.attack})`,
    };
  }

  if (character.defense < item.defenseRequirement) {
    return {
      meets: false,
      reason: `Requires ${item.defenseRequirement} defense (you have ${character.defense})`,
    };
  }

  if (character.speed < item.speedRequirement) {
    return {
      meets: false,
      reason: `Requires ${item.speedRequirement} speed (you have ${character.speed})`,
    };
  }

  if (character.perception < item.perceptionRequirement) {
    return {
      meets: false,
      reason: `Requires ${item.perceptionRequirement} perception (you have ${character.perception})`,
    };
  }

  return { meets: true };
}

/**
 * Get the CSS class for requirement status
 */
export function getRequirementClass(meets: boolean): string {
  return meets ? "text-green-400" : "text-red-400";
}

/**
 * Format item requirements for display
 */
export function formatItemRequirements(item: any): string[] {
  const requirements: string[] = [];

  if (item.levelRequirement > 1) {
    requirements.push(`Level ${item.levelRequirement}`);
  }

  if (item.attackRequirement > 0) {
    requirements.push(`${item.attackRequirement} Attack`);
  }

  if (item.defenseRequirement > 0) {
    requirements.push(`${item.defenseRequirement} Defense`);
  }

  if (item.speedRequirement > 0) {
    requirements.push(`${item.speedRequirement} Speed`);
  }

  if (item.perceptionRequirement > 0) {
    requirements.push(`${item.perceptionRequirement} Perception`);
  }

  return requirements;
}

/**
 * Get the CSS class for rarity
 */
export function getRarityClass(rarity: string): string {
  switch (rarity) {
    case "COMMON":
      return "text-gray-400";
    case "UNCOMMON":
      return "text-green-400";
    case "RARE":
      return "text-blue-400";
    case "EPIC":
      return "text-purple-400";
    case "LEGENDARY":
      return "text-yellow-400";
    default:
      return "text-gray-400";
  }
}

/**
 * Get the CSS class for rarity border
 */
export function getRarityBorderClass(rarity: string): string {
  switch (rarity) {
    case "COMMON":
      return "border-gray-500";
    case "UNCOMMON":
      return "border-green-500";
    case "RARE":
      return "border-blue-500";
    case "EPIC":
      return "border-purple-500";
    case "LEGENDARY":
      return "border-yellow-500";
    default:
      return "border-gray-500";
  }
}

/**
 * Calculate stat comparison (current vs with item)
 */
export function calculateStatComparison(
  currentStats: any,
  item: any,
  slot: EquipmentSlot
): {
  attack: number;
  defense: number;
  speed: number;
  perception: number;
  health: number;
} {
  // This is a simplified calculation - in a real implementation,
  // you'd want to get the current equipped item in this slot and calculate the difference

  const attackDiff =
    (item.attack || 0) + (item.attackPercent || 0) * (currentStats.attack || 0);
  const defenseDiff =
    (item.defense || 0) +
    (item.defensePercent || 0) * (currentStats.defense || 0);
  const speedDiff =
    (item.speed || 0) + (item.speedPercent || 0) * (currentStats.speed || 0);
  const perceptionDiff =
    (item.perception || 0) +
    (item.perceptionPercent || 0) * (currentStats.perception || 0);
  const healthDiff = item.health || 0;

  return {
    attack: attackDiff,
    defense: defenseDiff,
    speed: speedDiff,
    perception: perceptionDiff,
    health: healthDiff,
  };
}

/**
 * Get equipment slot position for paper doll layout
 */
export function getSlotPosition(slot: EquipmentSlot): {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
} {
  switch (slot) {
    case EquipmentSlot.HEAD:
      return { top: "0%", left: "50%", transform: "translateX(-50%)" };
    case EquipmentSlot.CHEST:
      return { top: "25%", left: "50%", transform: "translateX(-50%)" };
    case EquipmentSlot.LEGS:
      return { top: "50%", left: "50%", transform: "translateX(-50%)" };
    case EquipmentSlot.BOOTS:
      return { top: "75%", left: "50%", transform: "translateX(-50%)" };
    case EquipmentSlot.WEAPON:
      return { top: "30%", left: "20%" };
    case EquipmentSlot.OFF_HAND:
      return { top: "30%", right: "20%" };
    case EquipmentSlot.GLOVES:
      return { top: "35%", left: "10%", right: "10%" };
    case EquipmentSlot.RING:
      return { top: "40%", left: "5%", right: "5%" };
    case EquipmentSlot.AMULET:
      return { top: "20%", left: "50%", transform: "translateX(-50%)" };
    default:
      return {};
  }
}
