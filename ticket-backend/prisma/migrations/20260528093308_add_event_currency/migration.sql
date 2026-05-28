-- AlterTable
ALTER TABLE "ticket_db"."events" ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'USD';
