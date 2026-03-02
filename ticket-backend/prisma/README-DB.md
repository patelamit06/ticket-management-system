# Database setup (fresh deploy)

After the DB was removed from Docker (or first-time setup):

1. **Create new DB** – start Postgres in Docker:
   ```bash
   npm run db:up
   ```
   Or: `docker-compose up -d` (from `ticket-backend`).

2. **Deploy all existing migrations** (including `add_event_media`):
   ```bash
   npm run db:deploy
   ```
   Or: `npx prisma migrate deploy`.

3. **(Optional)** Seed data:
   ```bash
   npm run prisma:seed
   ```

4. **Generate Prisma client** (if not already done):
   ```bash
   npm run prisma:generate
   ```

Migrations are applied in order: `initial` → `add_country_iso_code` → `add_events_and_ticket_types` → `separate_discounts_from_ticket_types` → `add_event_media`.
