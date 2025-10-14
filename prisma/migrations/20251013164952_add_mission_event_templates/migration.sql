-- CreateTable
CREATE TABLE "MissionEventTemplate" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "eventTemplateId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionEventTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionEventTemplate_missionId_idx" ON "MissionEventTemplate"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionEventTemplate_missionId_eventTemplateId_key" ON "MissionEventTemplate"("missionId", "eventTemplateId");

-- AddForeignKey
ALTER TABLE "MissionEventTemplate" ADD CONSTRAINT "MissionEventTemplate_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionEventTemplate" ADD CONSTRAINT "MissionEventTemplate_eventTemplateId_fkey" FOREIGN KEY ("eventTemplateId") REFERENCES "EventTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
