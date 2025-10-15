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
  isNPC?: boolean;
  attackInterval?: number;
  nextAttackTime?: number;
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
  abilities?: unknown;
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
  monstersDefeated: number;
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
  private monstersDefeated: number = 0;
  private contributionByPlayer: Record<string, number> = {};
  private turnCount: number = 0;

  constructor() {
    this.gameStartTime = Date.now();
  }

  /**
   * Initialize combat with party members and monster configurations
   */
  initializeCombat(
    monsters: EnhancedMonster[],
    partyMembers: CombatPartyMember[]
  ): void {
    // Initialize monsters
    this.monsters = monsters.map((monster) => ({
      ...monster,
      health: monster.health || monster.maxHealth,
    }));

    // Initialize party members
    this.party = partyMembers.map((member) => ({
      ...member,
      currentHealth: member.currentHealth || member.maxHealth,
      isDead: false,
      // Preserve NPC attack timing properties
      isNPC: member.isNPC,
      attackInterval: member.attackInterval,
      nextAttackTime: member.nextAttackTime,
    }));

    // Reset combat stats
    this.totalClicks = 0;
    this.totalDamageDealt = 0;
    this.totalDamageTaken = {};
    this.totalBlocks = 0;
    this.totalParries = 0;
    this.totalPerfectParries = 0;
    this.playersRevived = 0;
    this.monstersDefeated = 0;
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
    const wasAlive = monster.health > 0;
    monster.health = Math.max(0, monster.health - damage);
    const isNowDead = wasAlive && monster.health === 0;

    // Update stats
    this.totalClicks++;
    this.totalDamageDealt += damage;
    this.turnCount++; // Increment turn count here
    this.contributionByPlayer[memberId] =
      (this.contributionByPlayer[memberId] || 0) + damage;

    // Count monsters defeated
    if (isNowDead) {
      this.monstersDefeated++;
    }

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
    const baseParryWindow = 500; // Base 500ms parry window (increased from 300ms)
    const baseBlockWindow = 1500; // Base 1.5s block window (increased from 1000ms)

    // Attack speed multiplier: 0.5x to 2.0x (from attackSpeed field)
    const speedMultiplier = Math.max(
      0.5,
      Math.min(2.0, monster.attackInterval)
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
    const baseParryWindow = 500; // Base 500ms parry window (increased from 300ms)
    const baseBlockWindow = 1500; // Base 1.5s block window (increased from 1000ms)

    // Attack speed multiplier: 0.5x to 2.0x (from attackSpeed field)
    const speedMultiplier = Math.max(
      0.5,
      Math.min(2.0, monster.attackInterval)
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
      monstersDefeated: this.monstersDefeated,
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
      turnCount: this.turnCount,
    };
  }

  /**
   * Restore state from saved combat data
   */
  restoreState(savedState: unknown): void {
    if (!savedState || typeof savedState !== "object") return;

    const state = savedState as Record<string, unknown>;

    if (state.monsters && Array.isArray(state.monsters)) {
      this.monsters = state.monsters as EnhancedMonster[];
    }

    if (state.party && Array.isArray(state.party)) {
      this.party = state.party as CombatPartyMember[];
    }

    if (typeof state.turnCount === "number") {
      this.turnCount = state.turnCount;
    }

    if (typeof state.playerDamageDealt === "number") {
      this.totalDamageDealt = state.playerDamageDealt;
    }

    if (state.enemyDamageDealt && typeof state.enemyDamageDealt === "object") {
      // enemyDamageDealt should be a Record<string, number> (damage taken per player)
      this.totalDamageTaken = state.enemyDamageDealt as Record<string, number>;
    }

    if (typeof state.monstersDefeated === "number") {
      this.monstersDefeated = state.monstersDefeated;
    }

    if (
      state.partyHealthUpdates &&
      typeof state.partyHealthUpdates === "object"
    ) {
      // Update party health from saved state
      Object.entries(
        state.partyHealthUpdates as Record<string, unknown>
      ).forEach(([memberId, health]) => {
        const member = this.party.find((p) => p.id === memberId);
        if (member && typeof health === "number") {
          member.currentHealth = health;
          member.isDead = health <= 0;
        }
      });
    }
  }

  /**
   * Show block button for monster attack
   */
  showBlockButton(monsterId: string): void {
    const monster = this.monsters.find((m) => m.id === monsterId);
    if (!monster) return;

    const now = Date.now();
    const attackTime = monster.nextAttackTime;

    this.blockStates[monsterId] = {
      monsterId,
      isVisible: true,
      warningStartTime: now,
      attackTime,
      isHolding: false,
    };
  }

  /**
   * Set next attack time for a monster
   */
  setNextAttackTime(monsterId: string): void {
    const monster = this.monsters.find((m) => m.id === monsterId);
    if (!monster) return;

    const now = Date.now();
    const baseInterval = monster.attackInterval * 1000; // Convert to milliseconds
    const variance = baseInterval * 0.2; // 20% variance
    const randomVariance = (Math.random() - 0.5) * variance;
    const nextAttackTime = now + baseInterval + randomVariance;

    monster.nextAttackTime = nextAttackTime;
  }

  /**
   * Handle block button click
   */
  handleBlockClick(monsterId: string): void {
    const blockState = this.blockStates[monsterId];
    if (!blockState || !blockState.isVisible) return;

    blockState.isHolding = true;
    blockState.clickTime = Date.now();
  }

  /**
   * Handle block button release
   */
  handleBlockRelease(monsterId: string): void {
    const blockState = this.blockStates[monsterId];
    if (!blockState) return;

    blockState.isHolding = false;
  }

  /**
   * Process monster attack with block/parry mechanics
   */
  processMonsterAttack(
    monsterId: string,
    targetId?: string,
    blockStatus?: "none" | "block" | "parry"
  ): void {
    const monster = this.monsters.find((m) => m.id === monsterId);
    const blockState = this.blockStates[monsterId];

    if (!monster) return;

    // Find target (use provided targetId or pick random)
    let target;
    if (targetId) {
      target = this.party.find(
        (member) => member.id === targetId && !member.isDead
      );
    }

    if (!target) {
      const aliveMembers = this.party.filter((member) => !member.isDead);
      if (aliveMembers.length === 0) return;
      target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
    }

    // Calculate damage
    const baseDamage = Math.max(1, monster.attack - target.defense);
    const damage = Math.floor(baseDamage * (0.8 + Math.random() * 0.4)); // 80-120% damage

    // Apply block/parry effects
    let finalDamage = damage;

    if (blockStatus === "parry") {
      finalDamage = 0;
      this.totalPerfectParries++;

      this.addDamageEvent({
        type: "parry",
        amount: 0,
        source: monster.name,
        target: target.name,
        timestamp: Date.now(),
      });
    } else if (blockStatus === "block") {
      finalDamage = Math.floor(damage * 0.3); // 70% damage reduction
      this.totalBlocks++;

      this.addDamageEvent({
        type: "block",
        amount: finalDamage,
        source: monster.name,
        target: target.name,
        timestamp: Date.now(),
      });
    }

    // Apply damage
    if (finalDamage > 0) {
      target.currentHealth = Math.max(0, target.currentHealth - finalDamage);

      if (target.currentHealth <= 0) {
        target.isDead = true;
      }

      this.addDamageEvent({
        type: "damage_taken",
        amount: finalDamage,
        source: monster.name,
        target: target.name,
        timestamp: Date.now(),
      });

      // Update damage taken tracking
      this.totalDamageTaken[target.id] =
        (this.totalDamageTaken[target.id] || 0) + finalDamage;
    }

    // Hide block button
    if (blockState) {
      blockState.isVisible = false;
      blockState.isHolding = false;
    }
  }
}
