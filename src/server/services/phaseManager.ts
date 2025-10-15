import { db } from "@/lib/db";
import { PhaseStatus } from "@prisma/client";
import { MonsterService } from "./monsterService";

export interface PhaseMonster {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  type: string;
  rarity: string;
  templateId: string;
}

export class PhaseManager {
  /**
   * Initialize all phases for a mission session
   */
  static async initializePhases(sessionId: string): Promise<void> {
    console.log(
      `🏗️ [PhaseManager] Initializing phases for session: ${sessionId}`
    );

    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { mission } = session;
    const phases = [];

    // Create all phases for the mission
    for (let i = 1; i <= mission.totalPhases; i++) {
      const phase = await db.missionPhase.create({
        data: {
          sessionId,
          phaseNumber: i,
          status: i === 1 ? PhaseStatus.PENDING : PhaseStatus.PENDING,
          monstersSpawned: [],
        },
      });
      phases.push(phase);
    }

    console.log(
      `🏗️ [PhaseManager] Created ${phases.length} phases for mission ${mission.name}`
    );
  }

  /**
   * Start a specific phase (spawn monsters)
   */
  static async startPhase(
    sessionId: string,
    phaseNumber: number
  ): Promise<any> {
    console.log(
      `🚀 [PhaseManager] Starting phase ${phaseNumber} for session: ${sessionId}`
    );

    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true, phases: true },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const phase = session.phases.find((p) => p.phaseNumber === phaseNumber);
    if (!phase) {
      throw new Error(
        `Phase ${phaseNumber} not found for session ${sessionId}`
      );
    }

    if (phase.status !== PhaseStatus.PENDING) {
      throw new Error(`Phase ${phaseNumber} is not in PENDING status`);
    }

    // Generate monsters for this phase
    const monsters = await this.generatePhaseMonsters(
      session.mission.id,
      phaseNumber,
      session.mission.totalPhases
    );

    // Update phase with spawned monsters
    const updatedPhase = await db.missionPhase.update({
      where: { id: phase.id },
      data: {
        status: PhaseStatus.ACTIVE,
        monstersSpawned: monsters,
        startedAt: new Date(),
      },
    });

    // Update session current phase
    await db.dungeonSession.update({
      where: { id: sessionId },
      data: { currentPhaseNumber: phaseNumber },
    });

    console.log(
      `🚀 [PhaseManager] Phase ${phaseNumber} started with ${monsters.length} monsters`
    );
    return updatedPhase;
  }

  /**
   * Generate monsters for a phase (random from pool, or boss for final phase)
   */
  static async generatePhaseMonsters(
    missionId: string,
    phaseNumber: number,
    totalPhases: number
  ): Promise<PhaseMonster[]> {
    console.log(
      `🎲 [PhaseManager] Generating monsters for phase ${phaseNumber}/${totalPhases}`
    );

    const mission = await db.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission) {
      throw new Error(`Mission ${missionId} not found`);
    }

    let monsters: PhaseMonster[] = [];

    if (phaseNumber === totalPhases && mission.finalBossTemplateId) {
      // Final phase - spawn boss
      console.log(`👑 [PhaseManager] Spawning boss for final phase`);
      const bossMonster = await MonsterService.generateMonsterFromTemplate(
        mission.finalBossTemplateId
      );
      if (bossMonster) {
        monsters = [bossMonster];
      }
    } else {
      // Regular phase - spawn random monsters from pool
      if (mission.monsterPoolIds.length === 0) {
        console.warn(
          `⚠️ [PhaseManager] No monster pool defined for mission ${missionId}`
        );
        return [];
      }

      // Generate 2-4 monsters for regular phases
      const monsterCount = Math.floor(Math.random() * 3) + 2; // 2-4 monsters

      for (let i = 0; i < monsterCount; i++) {
        const randomTemplateId =
          mission.monsterPoolIds[
            Math.floor(Math.random() * mission.monsterPoolIds.length)
          ];

        const monster = await MonsterService.generateMonsterFromTemplate(
          randomTemplateId
        );
        if (monster) {
          monsters.push(monster);
        }
      }
    }

    console.log(
      `🎲 [PhaseManager] Generated ${monsters.length} monsters for phase ${phaseNumber}`
    );
    return monsters;
  }

  /**
   * Complete current phase
   */
  static async completePhase(
    sessionId: string,
    phaseNumber: number
  ): Promise<void> {
    console.log(
      `✅ [PhaseManager] Completing phase ${phaseNumber} for session: ${sessionId}`
    );

    const phase = await db.missionPhase.findFirst({
      where: {
        sessionId,
        phaseNumber,
      },
    });

    if (!phase) {
      throw new Error(
        `Phase ${phaseNumber} not found for session ${sessionId}`
      );
    }

    if (phase.status !== PhaseStatus.ACTIVE) {
      throw new Error(`Phase ${phaseNumber} is not in ACTIVE status`);
    }

    await db.missionPhase.update({
      where: { id: phase.id },
      data: {
        status: PhaseStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    console.log(`✅ [PhaseManager] Phase ${phaseNumber} completed`);
  }

  /**
   * Start rest period
   */
  static async startRestPeriod(
    sessionId: string,
    phaseNumber: number
  ): Promise<void> {
    console.log(
      `😴 [PhaseManager] Starting rest period for phase ${phaseNumber}`
    );

    const phase = await db.missionPhase.findFirst({
      where: {
        sessionId,
        phaseNumber,
      },
    });

    if (!phase) {
      throw new Error(
        `Phase ${phaseNumber} not found for session ${sessionId}`
      );
    }

    if (phase.status !== PhaseStatus.COMPLETED) {
      throw new Error(
        `Phase ${phaseNumber} must be COMPLETED before starting rest`
      );
    }

    await db.missionPhase.update({
      where: { id: phase.id },
      data: {
        status: PhaseStatus.RESTING,
        restStartedAt: new Date(),
      },
    });

    console.log(
      `😴 [PhaseManager] Rest period started for phase ${phaseNumber}`
    );
  }

  /**
   * End rest period (heal party, advance to next phase)
   */
  static async endRestPeriod(
    sessionId: string,
    phaseNumber: number,
    didRest: boolean
  ): Promise<void> {
    console.log(
      `🏃 [PhaseManager] Ending rest period for phase ${phaseNumber}, didRest: ${didRest}`
    );

    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true, phases: true },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const phase = session.phases.find((p) => p.phaseNumber === phaseNumber);
    if (!phase) {
      throw new Error(
        `Phase ${phaseNumber} not found for session ${sessionId}`
      );
    }

    if (phase.status !== PhaseStatus.RESTING) {
      throw new Error(`Phase ${phaseNumber} is not in RESTING status`);
    }

    // Apply time penalty if they rested
    if (didRest) {
      const restDuration = session.mission.restDuration;
      const currentTime = new Date();
      const newEndTime = new Date(currentTime.getTime() + restDuration * 1000);

      await db.dungeonSession.update({
        where: { id: sessionId },
        data: { missionEndTime: newEndTime },
      });

      console.log(
        `⏰ [PhaseManager] Applied ${restDuration}s time penalty for resting`
      );
    }

    // Update phase
    await db.missionPhase.update({
      where: { id: phase.id },
      data: {
        restEndedAt: new Date(),
      },
    });

    // Start next phase if not the final phase
    const nextPhaseNumber = phaseNumber + 1;
    if (nextPhaseNumber <= session.mission.totalPhases) {
      await this.startPhase(sessionId, nextPhaseNumber);
    } else {
      // All phases completed - mission is done
      await db.dungeonSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED" },
      });
      console.log(`🎉 [PhaseManager] All phases completed! Mission finished.`);
    }

    console.log(`🏃 [PhaseManager] Rest period ended for phase ${phaseNumber}`);
  }

  /**
   * Check if all phases completed
   */
  static async checkMissionCompletion(sessionId: string): Promise<boolean> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: { mission: true, phases: true },
    });

    if (!session) {
      return false;
    }

    const completedPhases = session.phases.filter(
      (p) => p.status === PhaseStatus.COMPLETED
    );
    return completedPhases.length === session.mission.totalPhases;
  }

  /**
   * Get current phase for a session
   */
  static async getCurrentPhase(sessionId: string): Promise<any> {
    const session = await db.dungeonSession.findUnique({
      where: { id: sessionId },
      include: {
        mission: true,
        phases: {
          orderBy: { phaseNumber: "asc" },
        },
      },
    });

    if (!session) {
      return null;
    }

    // If session is in WAITING status, return null for currentPhase
    if (session.status === "WAITING") {
      return {
        session,
        currentPhase: null,
        allPhases: session.phases,
        phaseStatus: "WAITING" as const,
      };
    }

    const currentPhase = session.phases.find(
      (p) => p.phaseNumber === session.currentPhaseNumber
    );
    return {
      session,
      currentPhase,
      allPhases: session.phases,
      phaseStatus: currentPhase?.status || "PENDING",
    };
  }
}
