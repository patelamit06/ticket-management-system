-- CreateTable
CREATE TABLE "ticket_db"."swish_payment_requests" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "instruction_uuid" TEXT NOT NULL,
    "payee_payment_reference" TEXT NOT NULL,
    "swish_payment_id" TEXT,
    "payment_request_token" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'SEK',
    "payer_alias" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "error_code" TEXT,
    "error_message" TEXT,
    "raw_callback" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swish_payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "swish_payment_requests_instruction_uuid_key" ON "ticket_db"."swish_payment_requests"("instruction_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "swish_payment_requests_swish_payment_id_key" ON "ticket_db"."swish_payment_requests"("swish_payment_id");

-- CreateIndex
CREATE INDEX "swish_payment_requests_order_id_idx" ON "ticket_db"."swish_payment_requests"("order_id");

-- AddForeignKey
ALTER TABLE "ticket_db"."swish_payment_requests" ADD CONSTRAINT "swish_payment_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ticket_db"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
