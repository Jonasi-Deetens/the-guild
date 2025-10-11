export interface CombatPartyMember {
  id: string;
  name: string;
  currentHealth: number;
  maxHealth: number;
  attack: number;
  defense: number;
  agility: number;
  blockStrength: number;
  isDead: boolean;
}

export interface EnhancedMonster {
  id: string;
  templateId: string;
  name: string;
  type: "WARRIOR" | "RANGER" | "MAGE" | "HEALER" | "TANK" | "BERSERKER";
  rarity: "COMMON" | "ELITE" | "RARE" | "BOSS";
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  attackInterval: number;
  nextAttackTime: number;
  abilities?: any;
  description?: string;
}

export interface BlockState {
  monsterId: string;
  isVisible: boolean;
  warningStartTime: number;
  attackTime: number;
  isHolding: boolean;
  clickTime?: number;
  blockStatus?: "none" | "block" | "parry"; // Store the block status for when attack happens
}

export interface DamageEvent {
  id: string;
  type: "damage_dealt" | "damage_taken" | "heal" | "block" | "parry";
  amount: number;
  source: string;
  target: string;
  timestamp: number;
  isCritical?: boolean;
}

export interface CombatResult {
  victory: boolean;
  timeTaken: number;
  totalClicks: number;
  damageDealt: number;
  damageTaken: Record<string, number>;
  blocks: number;
  parries: number;
  perfectParries: number;
  playersRevived: number;
  contributionByPlayer: Record<string, number>;
  partyHealthUpdates: Record<string, number>;
}

export class CombatStateManager {
  private monsters: EnhancedMonster[] = [];
  private party: CombatPartyMember[] = [];
  private blockStates: Record<string, BlockState> = {};
  private damageLog: DamageEvent[] = [];
  private gameStartTime: number = 0;
  private totalClicks: number = 0;
  private totalDamageDealt: number = 0;
  private totalDamageTaken: Record<string, number> = {};
  private totalBlocks: number = 0;
  private totalParries: number = 0;
  private totalPerfectParries: number = 0;
  private playersRevived: number = 0;
  private contributionByPlayer: Record<string, number> = {};

  constructor() {
    this.gameStartTime = Date.now();
  }

  /**
   * Initialize combat with party members and monster configurations
   */
  initializeCombat(
    partyMembers: CombatPartyMember[],
    monsterConfigs: {
      templateIds: string[];
      minMonsters: number;
      maxMonsters: number;
      eliteChance: number;
      specialAbilityChance: number;
    }
  ): void {
    this.party = partyMembers.map((member) => ({
      ...member,
      currentHealth: member.currentHealth || member.maxHealth,
      isDead: false,
    }));

    // Reset combat stats
    this.totalClicks = 0;
    this.totalDamageDealt = 0;
    this.totalDamageTaken = {};
    this.totalBlocks = 0;
    this.totalParries = 0;
    this.totalPerfectParries = 0;
    this.playersRevived = 0;
    this.contributionByPlayer = {};
    this.damageLog = [];
    this.blockStates = {};

  }

  /**
   * Set monsters for combat (called after tRPC fetch)
   */
  setMonsters(monsters: EnhancedMonster[]): void {
    this.monsters = monsters;

    // Initialize block states for each monster
    this.monsters.forEach((monster) => {
      this.blockStates[monster.id] = {
        monsterId: monster.id,
        isVisible: false,
        warningStartTime: 0,
        attackTime: 0,
        isHolding: false,
      };
    });
  }

  /**
   * Calculate damage with defense reduction
   */
  calculateDamage(
    attacker: { attack: number; criticalChance?: number },
    defender: { defense: number },
    isBlocking: boolean = false,
    isParry: boolean = false,
    blockStrength: number = 0
  ): number {
    let baseDamage = attacker.attack;

    // Check for critical hit
    const isCritical = Math.random() < (attacker.criticalChance || 0.05);
    if (isCritical) {
      baseDamage = Math.floor(baseDamage * 1.5);
    }

    // Apply defense reduction
    let actualDamage = Math.max(1, baseDamage - defender.defense);

    // Apply block reduction
    if (isBlocking) {
      actualDamage = Math.max(1, actualDamage - blockStrength);
    }

    // Parry blocks all damage
    if (isParry) {
      actualDamage = 0;
    }

    return actualDamage;
  }

  /**
   * Process monster attack on a party member
   */
  processMonsterAttack(
    monsterId: string,
    targetId: string,
    blockStatus: "none" | "block" | "parry"
  ): { damage: number; isBlocked: boolean; isParried: boolean } {
    const monster = this.monsters.find((m) => m.id === monsterId);
    const target = this.party.find((p) => p.id === targetId);

    if (!monster || !target || target.isDead) {
      return { damage: 0, isBlocked: false, isParried: false };
    }

    const isBlocking = blockStatus === "block";
    const isParry = blockStatus === "parry";

    const damage = this.calculateDamage(
      monster,
      target,
      isBlocking,
      isParry,
      target.blockStrength
    );

    // Apply damage
    const newHealth = Math.max(0, target.currentHealth - damage);
    target.currentHealth = newHealth;
    target.isDead = newHealth === 0;

    // Update stats
    this.totalDamageTaken[targetId] =
      (this.totalDamageTaken[targetId] || 0) + damage;

    if (isBlocking) {
      this.totalBlocks++;
    }
    if (isParry) {
      this.totalParries++;
      this.totalPerfectParries++;
    }

    // Log damage event
    this.addDamageEvent({
      type: "damage_taken",
      amount: damage,
      source: monster.name,
      target: target.name,
      timestamp: Date.now(),
    });

    if (isParry) {
      this.addDamageEvent({
        type: "parry",
        amount: 0,
        source: target.name,
        target: monster.name,
        timestamp: Date.now(),
      });
    } else if (isBlocking) {
      this.addDamageEvent({
        type: "block",
        amount: damage,
        source: target.name,
        target: monster.name,
        timestamp: Date.now(),
      });
    }

    return { damage, isBlocked: isBlocking, isParried: isParry };
  }

  /**
   * Process party member attack on a monster
   */
  processPartyAttack(
    memberId: string,
    monsterId: string
  ): { damage: number; isCritical: boolean } {
    const member = this.party.find((p) => p.id === memberId);
    const monster = this.monsters.find((m) => m.id === monsterId);

    if (!member || !monster || member.isDead || monster.health <= 0) {
      return { damage: 0, isCritical: false };
    }

    const damage = this.calculateDamage(
      { attack: member.attack, criticalChance: 0.05 }, // Base 5% crit chance
      monster
    );

    const isCritical = damage > member.attack;

    // Apply damage
    monster.health = Math.max(0, monster.health - damage);

    // Update stats
    this.totalClicks++;
    this.totalDamageDealt += damage;
    this.contributionByPlayer[memberId] =
      (this.contributionByPlayer[memberId] || 0) + damage;

    // Log damage event
    this.addDamageEvent({
      type: "damage_dealt",
      amount: damage,
      source: member.name,
      target: monster.name,
      timestamp: Date.now(),
      isCritical,
    });

    return { damage, isCritical };
  }

  /**
   * Check if a block click was within the parry window
   */
  checkBlockWindow(
    monsterId: string,
    clickTime: number
  ): "none" | "block" | "parry" {
    const blockState = this.blockStates[monsterId];
    if (!blockState || !blockState.isVisible) {
      return "none";
    }

    const monster = this.monsters.find((m) => m.id === monsterId);
    if (!monster) return "none";

    const timeUntilAttack = blockState.attackTime - clickTime;

    // Dynamic windows based on monster attack speed
    // Faster monsters = shorter, more challenging windows
    // Slower monsters = longer, more forgiving windows
    const baseParryWindow = 300; // Base 300ms parry window
    const baseBlockWindow = 1000; // Base 1s block window

    // Attack speed multiplier: 0.5x to 2.0x (from attackSpeed field)
    const speedMultiplier = Math.max(
      0.5,
      Math.min(2.0, monster.attackInterval / 1000)
    );

    const parryWindow = Math.floor(baseParryWindow * speedMultiplier);
    const blockWindow = Math.floor(baseBlockWindow * speedMultiplier);

    // Perfect parry: click within dynamic window before attack
    if (timeUntilAttack > 0 && timeUntilAttack <= parryWindow) {
      return "parry";
    }
    // Regular block: click within dynamic window before attack
    else if (timeUntilAttack > 0 && timeUntilAttack <= blockWindow) {
      return "block";
    }

    return "none";
  }

  /**
   * Show block button for a monster (2 seconds before attack)
   */
  showBlockButton(monsterId: string): void {
    const monster = this.monsters.find((m) => m.id === monsterId);
    if (!monster) return;

    const now = Date.now();
    const warningTime = 2000; // 2 seconds warning
    const attackTime = now + warningTime;

    this.blockStates[monsterId] = {
      monsterId,
      isVisible: true,
      warningStartTime: now,
      attackTime,
      isHolding: false,
    };

  }

  /**
   * Hide block button for a monster
   */
  hideBlockButton(monsterId: string): void {
    if (this.blockStates[monsterId]) {
      this.blockStates[monsterId].isVisible = false;
      this.blockStates[monsterId].isHolding = false;
    }
  }

  /**
   * Register a block attempt (called when player clicks block button)
   */
  registerBlockAttempt(monsterId: string, clickTime: number): void {
    const blockState = this.blockStates[monsterId];
    if (!blockState || !blockState.isVisible) return;

    const blockStatus = this.checkBlockWindow(monsterId, clickTime);

    this.blockStates[monsterId] = {
      ...blockState,
      isHolding: true,
      clickTime,
      blockStatus, // Store the block status for when attack happens
    };
  }

  /**
   * Set next attack time for a monster
   */
  setNextAttackTime(monsterId: string): void {
    const monster = this.monsters.find((m) => m.id === monsterId);
    if (monster) {
      monster.nextAttackTime = Date.now() + monster.attackInterval;
    }
  }

  /**
   * Get current block timing state for visual feedback
   */
  getBlockTimingState(monsterId: string): {
    timeUntilAttack: number;
    isInParryWindow: boolean;
    isInBlockWindow: boolean;
    progress: number; // 0-1 progress through the warning period
    parryWindow: number; // Current parry window in ms
    blockWindow: number; // Current block window in ms
    attackSpeed: number; // Monster's attack speed multiplier
  } {
    const blockState = this.blockStates[monsterId];
    if (!blockState || !blockState.isVisible) {
      return {
        timeUntilAttack: 0,
        isInParryWindow: false,
        isInBlockWindow: false,
        progress: 0,
        parryWindow: 0,
        blockWindow: 0,
        attackSpeed: 1,
      };
    }

    const monster = this.monsters.find((m) => m.id === monsterId);
    if (!monster) {
      return {
        timeUntilAttack: 0,
        isInParryWindow: false,
        isInBlockWindow: false,
        progress: 0,
        parryWindow: 0,
        blockWindow: 0,
        attackSpeed: 1,
      };
    }

    const now = Date.now();
    const timeUntilAttack = blockState.attackTime - now;
    const totalWarningTime = 2000; // 2 seconds total warning
    const elapsed = now - blockState.warningStartTime;
    const progress = Math.max(0, Math.min(1, elapsed / totalWarningTime));

    // Dynamic windows based on monster attack speed
    const baseParryWindow = 300; // Base 300ms parry window
    const baseBlockWindow = 1000; // Base 1s block window

    // Attack speed multiplier: 0.5x to 2.0x (from attackSpeed field)
    const speedMultiplier = Math.max(
      0.5,
      Math.min(2.0, monster.attackInterval / 1000)
    );

    const parryWindow = Math.floor(baseParryWindow * speedMultiplier);
    const blockWindow = Math.floor(baseBlockWindow * speedMultiplier);

    return {
      timeUntilAttack: Math.max(0, timeUntilAttack),
      isInParryWindow: timeUntilAttack > 0 && timeUntilAttack <= parryWindow,
      isInBlockWindow: timeUntilAttack > 0 && timeUntilAttack <= blockWindow,
      progress,
      parryWindow,
      blockWindow,
      attackSpeed: speedMultiplier,
    };
  }

  /**
   * Add damage event to log
   */
  addDamageEvent(event: Omit<DamageEvent, "id">): void {
    const damageEvent: DamageEvent = {
      ...event,
      id: `damage-${Date.now()}-${Math.random()}`,
    };
    this.damageLog.push(damageEvent);

    // Keep only last 50 events
    if (this.damageLog.length > 50) {
      this.damageLog = this.damageLog.slice(-50);
    }
  }

  /**
   * Revive a party member
   */
  revivePartyMember(memberId: string): boolean {
    const member = this.party.find((p) => p.id === memberId);
    if (!member || !member.isDead) {
      return false;
    }

    member.currentHealth = Math.floor(member.maxHealth * 0.5); // Revive with 50% health
    member.isDead = false;
    this.playersRevived++;

    this.addDamageEvent({
      type: "heal",
      amount: member.currentHealth,
      source: "Revive",
      target: member.name,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Check win/lose conditions
   */
  checkGameEnd(): { isOver: boolean; victory: boolean } {
    const aliveMembers = this.party.filter((member) => !member.isDead);
    const aliveMonsters = this.monsters.filter((monster) => monster.health > 0);

    if (aliveMonsters.length === 0) {
      return { isOver: true, victory: true };
    } else if (aliveMembers.length === 0) {
      return { isOver: true, victory: false };
    }

    return { isOver: false, victory: false };
  }

  /**
   * Get final combat result
   */
  getCombatResult(): CombatResult {
    const timeTaken = Date.now() - this.gameStartTime;
    const { victory } = this.checkGameEnd();

    // Calculate party health updates
    const partyHealthUpdates: Record<string, number> = {};
    this.party.forEach((member) => {
      partyHealthUpdates[member.id] = member.currentHealth;
    });

    return {
      victory,
      timeTaken,
      totalClicks: this.totalClicks,
      damageDealt: this.totalDamageDealt,
      damageTaken: this.totalDamageTaken,
      blocks: this.totalBlocks,
      parries: this.totalParries,
      perfectParries: this.totalPerfectParries,
      playersRevived: this.playersRevived,
      contributionByPlayer: this.contributionByPlayer,
      partyHealthUpdates,
    };
  }

  /**
   * Get current state for UI
   */
  getState() {
    return {
      monsters: [...this.monsters], // Create new array reference
      party: [...this.party], // Create new array reference
      blockStates: { ...this.blockStates }, // Create new object reference
      damageLog: [...this.damageLog], // Create new array reference
      gameStartTime: this.gameStartTime,
    };
  }
}
