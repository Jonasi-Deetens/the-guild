-- DropForeignKey
ALTER TABLE "public"."DungeonSession" DROP CONSTRAINT "DungeonSession_partyId_fkey";

-- AlterTable
ALTER TABLE "DungeonSession" ALTER COLUMN "partyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DungeonSession" ADD CONSTRAINT "DungeonSession_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;
