-- AlterTable
ALTER TABLE "ticket_db"."country" ADD COLUMN "iso_code" TEXT;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "country_iso_code_key" ON "ticket_db"."country"("iso_code");
