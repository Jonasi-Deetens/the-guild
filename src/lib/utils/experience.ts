/**
 * Experience and Leveling System Utilities
 *
 * New aggressive scaling formula: (level² × 100) + (level × 50)
 * This makes players work harder for each level compared to the old formula.
 */

const MAX_LEVEL = 20;
const STAT_POINTS_PER_LEVEL = 5;

/**
 * Calculate the total experience required to reach a specific level
 * Formula: (level² × 100) + (level × 50)
 */
export function getExperienceForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 100 + (level - 1) * 50;
}

/**
 * Calculate what level a character should be based on their total experience
 * Caps at MAX_LEVEL (20)
 */
export function calculateLevelFromExperience(experience: number): number {
  let level = 1;

  while (level < MAX_LEVEL) {
    const nextLevelExp = getExperienceForLevel(level + 1);
    if (experience < nextLevelExp) {
      break;
    }
    level++;
  }

  return level;
}

/**
 * Get experience info for displaying progress bars and level up requirements
 */
export function getExperienceInfo(
  currentLevel: number,
  currentExperience: number
) {
  const cappedLevel = Math.min(currentLevel, MAX_LEVEL);

  // If at max level
  if (cappedLevel >= MAX_LEVEL) {
    return {
      currentLevel: MAX_LEVEL,
      currentExperience,
      experienceToNext: 0,
      experienceProgress: 0,
      experienceNeeded: 0,
      progressPercentage: 100,
      isMaxLevel: true,
      canLevelUp: false,
    };
  }

  const currentLevelExp = getExperienceForLevel(cappedLevel);
  const nextLevelExp = getExperienceForLevel(cappedLevel + 1);
  const expProgress = currentExperience - currentLevelExp;
  const expNeeded = nextLevelExp - currentLevelExp;
  const expToNext = nextLevelExp - currentExperience;

  // Check if player has enough XP to level up
  const canLevelUp = currentExperience >= nextLevelExp;

  // Cap progress at 100% for display
  const progressPercentage = Math.min(
    100,
    Math.round((expProgress / expNeeded) * 100)
  );

  return {
    currentLevel: cappedLevel,
    currentExperience,
    experienceToNext: Math.max(0, expToNext),
    experienceProgress: expProgress,
    experienceNeeded: expNeeded,
    progressPercentage,
    isMaxLevel: false,
    canLevelUp,
  };
}

/**
 * Calculate how many levels a character can gain from their current experience
 */
export function calculatePendingLevels(
  currentLevel: number,
  currentExperience: number
): number {
  const newLevel = calculateLevelFromExperience(currentExperience);
  return Math.max(0, newLevel - currentLevel);
}

/**
 * Get the maximum level cap
 */
export function getMaxLevel(): number {
  return MAX_LEVEL;
}

/**
 * Get stat points available per level
 */
export function getStatPointsPerLevel(): number {
  return STAT_POINTS_PER_LEVEL;
}

/**
 * Validate stat allocations for a level up
 */
export function validateStatAllocations(allocations: Record<string, number>): {
  isValid: boolean;
  totalPoints: number;
  expectedPoints: number;
  error?: string;
} {
  const totalPoints = Object.values(allocations).reduce(
    (sum, val) => sum + val,
    0
  );
  const expectedPoints = STAT_POINTS_PER_LEVEL;

  if (totalPoints !== expectedPoints) {
    return {
      isValid: false,
      totalPoints,
      expectedPoints,
      error: `Total stat points must equal ${expectedPoints}, got ${totalPoints}`,
    };
  }

  // Check for negative values
  for (const [stat, value] of Object.entries(allocations)) {
    if (value < 0) {
      return {
        isValid: false,
        totalPoints,
        expectedPoints,
        error: `Stat ${stat} cannot be negative`,
      };
    }
  }

  return {
    isValid: true,
    totalPoints,
    expectedPoints,
  };
}

/**
 * Generate XP requirements table for reference
 */
export function generateXPTable(): Array<{
  level: number;
  xpRequired: number;
  xpToNext: number;
}> {
  const table = [];

  for (let level = 1; level <= MAX_LEVEL; level++) {
    const xpRequired = getExperienceForLevel(level);
    const xpToNext =
      level < MAX_LEVEL ? getExperienceForLevel(level + 1) - xpRequired : 0;

    table.push({
      level,
      xpRequired,
      xpToNext,
    });
  }

  return table;
}
