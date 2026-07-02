-- AlterTable
ALTER TABLE "ticket_db"."users" ADD COLUMN "password_reset_token_hash" TEXT;
ALTER TABLE "ticket_db"."users" ADD COLUMN "password_reset_expires_at" TIMESTAMP(3);
