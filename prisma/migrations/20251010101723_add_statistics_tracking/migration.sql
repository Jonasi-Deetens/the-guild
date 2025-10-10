-- CreateTable
CREATE TABLE "DungeonStatistics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "completedEvents" INTEGER NOT NULL DEFAULT 0,
    "failedEvents" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "enemiesDefeated" INTEGER NOT NULL DEFAULT 0,
    "damageDealt" INTEGER NOT NULL DEFAULT 0,
    "damageTaken" INTEGER NOT NULL DEFAULT 0,
    "timesFled" INTEGER NOT NULL DEFAULT 0,
    "goldEarned" INTEGER NOT NULL DEFAULT 0,
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "chestsOpened" INTEGER NOT NULL DEFAULT 0,
    "experienceGained" INTEGER NOT NULL DEFAULT 0,
    "levelsGained" INTEGER NOT NULL DEFAULT 0,
    "combatEvents" INTEGER NOT NULL DEFAULT 0,
    "treasureEvents" INTEGER NOT NULL DEFAULT 0,
    "trapEvents" INTEGER NOT NULL DEFAULT 0,
    "puzzleEvents" INTEGER NOT NULL DEFAULT 0,
    "choiceEvents" INTEGER NOT NULL DEFAULT 0,
    "restEvents" INTEGER NOT NULL DEFAULT 0,
    "bossEvents" INTEGER NOT NULL DEFAULT 0,
    "averageEventTime" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "efficiency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DungeonStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterStatistics" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "totalDungeonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalDungeonsFailed" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "totalGoldEarned" INTEGER NOT NULL DEFAULT 0,
    "totalExperienceGained" INTEGER NOT NULL DEFAULT 0,
    "totalLevelsGained" INTEGER NOT NULL DEFAULT 0,
    "totalEnemiesDefeated" INTEGER NOT NULL DEFAULT 0,
    "totalDamageDealt" INTEGER NOT NULL DEFAULT 0,
    "totalDamageTaken" INTEGER NOT NULL DEFAULT 0,
    "totalTimesFled" INTEGER NOT NULL DEFAULT 0,
    "totalItemsFound" INTEGER NOT NULL DEFAULT 0,
    "totalChestsOpened" INTEGER NOT NULL DEFAULT 0,
    "totalItemsUsed" INTEGER NOT NULL DEFAULT 0,
    "averageDungeonTime" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageGoldPerDungeon" INTEGER NOT NULL DEFAULT 0,
    "averageXPPerDungeon" INTEGER NOT NULL DEFAULT 0,
    "longestDungeonTime" INTEGER NOT NULL DEFAULT 0,
    "mostGoldInDungeon" INTEGER NOT NULL DEFAULT 0,
    "mostXPInDungeon" INTEGER NOT NULL DEFAULT 0,
    "mostEnemiesInDungeon" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DungeonStatistics_sessionId_key" ON "DungeonStatistics"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterStatistics_characterId_key" ON "CharacterStatistics"("characterId");

-- AddForeignKey
ALTER TABLE "DungeonStatistics" ADD CONSTRAINT "DungeonStatistics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DungeonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterStatistics" ADD CONSTRAINT "CharacterStatistics_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
