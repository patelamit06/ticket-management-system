-- AlterTable
ALTER TABLE "ticket_db"."event_discounts" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ticket_db"."ticket_types" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
