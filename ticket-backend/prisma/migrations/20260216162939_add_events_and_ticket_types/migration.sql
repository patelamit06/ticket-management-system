-- CreateTable
CREATE TABLE "ticket_db"."events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "banner_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "organizer_id" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "group_discount_tiers" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_db"."ticket_types" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'regular',
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "maxPerOrder" INTEGER NOT NULL DEFAULT 10,
    "availability_start" TIMESTAMP(3),
    "availability_end" TIMESTAMP(3),
    "age_min" INTEGER,
    "age_max" INTEGER,
    "discount_percent" DECIMAL(5,2),
    "base_ticket_type_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket_db"."events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "ticket_db"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_db"."ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "ticket_db"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_db"."ticket_types" ADD CONSTRAINT "ticket_types_base_ticket_type_id_fkey" FOREIGN KEY ("base_ticket_type_id") REFERENCES "ticket_db"."ticket_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
