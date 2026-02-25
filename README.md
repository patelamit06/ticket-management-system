# Event Management & Ticketing System

Monorepo for the Event Ticketing platform: **ticket-backend** (NestJS) and **ticket-frontend** (Next.js).

## Quick start

### Prerequisites

- Node.js 22 LTS or 24 LTS (or 20.9+)
- PostgreSQL 16+
- npm (or pnpm)

### Backend

Uses **Prisma 7** (connection in `prisma.config.ts`; client in `generated/prisma`; `postinstall` runs `prisma generate`).

```bash
cd ticket-backend
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, PORT=3001
npm run prisma:migrate   # create DB and run migrations
npm run start:dev        # http://localhost:3001, Swagger at /api
```

### Frontend

```bash
cd ticket-frontend
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev              # http://localhost:3000
```

## Project structure

- **ticket-backend** – NestJS API (auth, users, events, ticket-types, orders, payments, tickets, check-in, admin, reports). Prisma + PostgreSQL. Swagger at `/api`.
- **ticket-frontend** – Next.js 16 (App Router), React 19, Tailwind, shadcn/ui. TanStack Query, React Hook Form + Zod.
- **docs/** – [Implementation plan](docs/README.md), [FEATURE_STATUS](docs/FEATURE_STATUS.md), [GAPS_AND_ASSUMPTIONS](docs/GAPS_AND_ASSUMPTIONS.md), feature folders (tasks + smart prompts).

## Phase 1 status

- [x] Project setup (backend + frontend repos, env, Swagger, Prisma, skeleton modules, API client, providers)
- [ ] Authentication (02)
- [ ] Users & roles (03)
- [ ] Events CRUD (04)
- [ ] Ticket types (05)

See [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) and [docs/FEATURE_STATUS.md](docs/FEATURE_STATUS.md) for full plan.
