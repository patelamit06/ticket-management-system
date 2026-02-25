-- DropForeignKey (ticket_types.base_ticket_type_id)
ALTER TABLE "ticket_db"."ticket_types" DROP CONSTRAINT IF EXISTS "ticket_types_base_ticket_type_id_fkey";

-- DropColumn (ticket_types)
ALTER TABLE "ticket_db"."ticket_types" DROP COLUMN IF EXISTS "base_ticket_type_id";
ALTER TABLE "ticket_db"."ticket_types" DROP COLUMN IF EXISTS "category";
ALTER TABLE "ticket_db"."ticket_types" DROP COLUMN IF EXISTS "discount_percent";

-- CreateTable (event_discounts)
CREATE TABLE "ticket_db"."event_discounts" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "min_quantity" INTEGER,
    "ticket_type_ids" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_discounts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket_db"."event_discounts" ADD CONSTRAINT "event_discounts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "ticket_db"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
