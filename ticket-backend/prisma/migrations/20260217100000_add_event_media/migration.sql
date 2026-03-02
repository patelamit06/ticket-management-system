-- CreateTable
CREATE TABLE "ticket_db"."event_media" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket_db"."event_media" ADD CONSTRAINT "event_media_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "ticket_db"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
