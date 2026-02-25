# Implementation Guide

How to build and ship the Event Management & Ticketing System: order of work, environment setup, and deployment. Use with [FEATURE_STATUS.md](FEATURE_STATUS.md) and the [feature folders](features/README.md).

---

## 0. Implementation readiness

**You are ready to implement** when:

- [x] Plan and architecture are defined (Cursor plan + this doc).
- [x] Features are listed with status and task breakdowns ([FEATURE_STATUS.md](FEATURE_STATUS.md), feature folders).
- [x] Gaps and assumptions are documented and decisions logged ([GAPS_AND_ASSUMPTIONS.md](GAPS_AND_ASSUMPTIONS.md)).
- [x] Multi-country, payouts, tax, and guest checkout are specified ([MULTI_COUNTRY_AND_PAYMENTS.md](MULTI_COUNTRY_AND_PAYMENTS.md), GAPS).
- [x] Implementation and developer guides exist (this doc, [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)).
- [ ] You have confirmed or overridden key assumptions in GAPS_AND_ASSUMPTIONS (optional but recommended before Phase 2+).

Start with **Phase 1** (features 01–05). Use the [recommended stack and versions](#recommended-stack-2026) below and the [modern UI guidance](#modern-ui-guidance) for the frontend.

---

## 0.1 Recommended stack (2026)

Use **latest stable** versions at the time you create the repos. Below are current targets (verify with official docs before install).

| Layer | Technology | Suggested version (2026) | Notes |
|-------|------------|--------------------------|--------|
| **Frontend** | Next.js | 16.x | App Router default; Turbopack; React 19. Use `npx create-next-app@latest`. |
| | React | 19.x | Bundled with Next.js 16. |
| | TypeScript | 5.x | Enable in create-next-app. |
| | Tailwind CSS | 4.x (or 3.x stable) | v4: `@tailwindcss/vite` or Next.js integration; v3 if you need maximum stability. |
| | shadcn/ui | Latest | Components + Tailwind; check [ui.shadcn.com](https://ui.shadcn.com). RTL support (2026). |
| | React Hook Form + Zod | Latest | Forms and validation. |
| | TanStack Query | v5 | Data fetching and cache. |
| **Backend** | NestJS | 11.x | Use `nest new` or Nest CLI; Express or Fastify. |
| | TypeScript | 5.x | Strict mode. |
| | PostgreSQL | 16+ | Local or managed (e.g. Neon, Supabase). |
| | Prisma or TypeORM | Latest | ORM and migrations. |
| | class-validator / class-transformer | Latest | DTO validation. |
| | Stripe | Latest SDK | Payments and Connect. |
| **Runtime** | Node.js | 22 LTS or 24 LTS | Minimum Node 20.9+ for Next.js 16. Prefer 22 or 24 LTS. |
| **Package manager** | pnpm | 9.x | Or npm 10+; lockfile and single manager across repos. |

**Check versions before scaffolding:** `npm show next nestjs @nestjs/core react tailwindcss version` (or use [nodejs.org](https://nodejs.org), [nextjs.org](https://nextjs.org), [nestjs.com](https://nestjs.com)).

---

## 0.2 Modern UI guidance

Align the frontend with **current design trends** so the app feels up to date and trustworthy (see e.g. [Webflow 2026 trends](https://webflow.com/blog/web-design-trends-2026), [Landdding UI trends 2026](https://landdding.com/blog/ui-design-trends-2026)):

- **Layout and hierarchy**
  - Prefer **modular / bento-style** layouts for dashboards and landing: card-based grids with clear hierarchy and varied card sizes where it helps (e.g. event list, organizer dashboard).
  - Use clear **whitespace** and sections; avoid dense, uniform grids unless for data tables.
- **Motion and feedback**
  - Use **motion for meaning**: loading states, success/error toasts, micro-interactions on buttons and cards (e.g. hover, focus). Avoid decorative-only animation.
  - Consider **skeleton loaders** (shadcn Skeleton) and smooth transitions for list/detail and route changes.
- **Color and typography**
  - **Intentional palette**: muted, soft backgrounds (e.g. cool grays, light teals); **bold accent** for primary actions (e.g. “Buy ticket”, “Create event”). Keep contrast and accessibility (WCAG).
  - **Typography**: clear hierarchy (heading, body, caption); consider a distinctive but readable font for headings and a neutral one for body (shadcn uses CSS variables – override in your theme).
- **Components and craft**
  - Use **shadcn/ui** as the base; customize tokens (colors, radius, spacing) so the app doesn’t look generic. Add **custom illustrations or imagery** where it fits (e.g. empty states, event placeholders).
  - **Mobile-first**: responsive event cards, bottom sheets or dialogs for filters/checkout on small screens, touch-friendly tap targets.
- **Accessibility**
  - Semantic HTML, ARIA where needed, keyboard navigation, focus management in modals. shadcn components help; test with a screen reader and axe.

Reference modern ticketing or SaaS sites (e.g. [Ticketly](https://www.ticketly.eu/), current event platforms) for layout and flow; differentiate with your own color system, typography, and motion.

---

## 1. Implementation order and dependencies

Follow phases so dependencies are in place before dependent features.

| Phase | Features | Dependency notes |
|-------|----------|------------------|
| **1 – Foundation** | 01 Project setup, 02 Auth, 03 Users & roles, 04 Events CRUD, 05 Ticket types | Setup first; Auth before protected routes; Events before ticket types. |
| **2 – Ticketing & payments** | 06 Orders & cart, 07 Payments (Stripe), 08 Tickets & QR, 09 Organizer dashboard (basic) | Orders before Payments; Payments creates tickets. |
| **3 – Organizer & check-in** | 10 Check-in, 11 Sub-users, 12 Sales & reports | Check-in needs tickets; Sub-users need organizer and permissions. |
| **4 – Super Admin** | 13 Admin dashboard, 14 Approval & payouts | Admin depends on events and users. |
| **5 – Polish** | 15 Notifications, 16 Discount codes | Can parallelize; discount codes touch checkout. |

**Best practices:**

- Complete feature **backend first** (or backend + frontend together) so API contract is stable before UI.
- Mark a feature **Done** in [FEATURE_STATUS.md](FEATURE_STATUS.md) only when backend and frontend are implemented and manually tested.
- Use **feature flags** or branch-by-feature if multiple people work in parallel; merge when feature is complete.

---

## 2. Environment setup (first-time)

### Prerequisites

- **Node.js** 22 LTS or 24 LTS (minimum 20.9+ for Next.js 16)
- **pnpm** 9.x or **npm** 10+ (use one consistently; lockfile in repo)
- **PostgreSQL** 16+ (local or hosted, e.g. Neon, Supabase)
- **Git**
- **Stripe** account (for payments; use test mode during development)

### Backend repo (`ticket-backend`)

```bash
git clone <backend-repo-url>
cd ticket-backend
pnpm install
cp .env.example .env   # then edit .env
```

**.env (development):**

- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – Strong random string (e.g. `openssl rand -base64 32`)
- `PORT` – e.g. `3001`
- `STRIPE_SECRET_KEY` – Stripe test key
- `STRIPE_WEBHOOK_SECRET` – From Stripe CLI or dashboard (for local webhook testing)
- Optional: `SENDGRID_API_KEY` or `RESEND_API_KEY` for emails

**Run:**

```bash
pnpm run migration:run   # or prisma migrate / typeorm migration:run
pnpm run start:dev
```

API: `http://localhost:3001`; Swagger: `http://localhost:3001/api` (or as configured).

### Frontend repo (`ticket-frontend`)

```bash
git clone <frontend-repo-url>
cd ticket-frontend
pnpm install
cp .env.local.example .env.local
```

**.env.local:**

- `NEXT_PUBLIC_API_URL` – e.g. `http://localhost:3001`

**Run:**

```bash
pnpm run dev
```

App: `http://localhost:3000`.

### Best practices

- **Never commit** `.env` or `.env.local`; provide `.env.example` with placeholder keys and document each variable.
- Use **different Stripe keys** for dev/staging/production; use Stripe CLI for local webhook testing.
- Keep **Node and pnpm versions** in `package.json` engines or in a `.nvmrc` / `.node-version` for consistency.

---

## 3. From zero to first run

1. **Backend:** Clone → install → configure `.env` → run migrations → `start:dev`. Confirm health check and Swagger.
2. **Frontend:** Clone → install → set `NEXT_PUBLIC_API_URL` → `dev`. Confirm home/login page loads.
3. **Smoke test:** Register a user, log in, create an event (if features 01–04 are done). Use [feature folders](features/README.md) and [FEATURE_STATUS.md](FEATURE_STATUS.md) for task-level steps.

---

## 4. Deployment (high-level)

- **Backend:** Build (e.g. `pnpm run build`); run migrations on target DB; set env (DB, JWT, Stripe, etc.); run Node process (e.g. PM2 or container). Use **HTTPS** and keep secrets in env or secret manager.
- **Frontend:** Build (`pnpm run build`); serve `out/` (static) or use Node server; set `NEXT_PUBLIC_API_URL` to production API.
- **Database:** Prefer managed PostgreSQL; back up regularly; run migrations in a controlled way (CI or manual step).
- **Stripe:** Switch to live keys in production; configure production webhook URL; verify webhook secret.

**Best practices:**

- Use **environment-specific config** (dev/staging/prod); no hardcoded URLs or keys.
- **Health check** endpoint for backend; use it in load balancer or orchestrator.
- Prefer **single deployable artifact** per repo (e.g. one Docker image for API) and document the deploy process in the repo README.

---

## 5. References

| Document | Purpose |
|----------|---------|
| [FEATURE_STATUS.md](FEATURE_STATUS.md) | All features and status; link to feature folders. |
| [features/](features/README.md) | Per-feature tasks and smart prompts. |
| [GAPS_AND_ASSUMPTIONS.md](GAPS_AND_ASSUMPTIONS.md) | Requirements gaps and decisions. |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Day-to-day development: structure, conventions, workflows. |
| Implementation plan (in Cursor plan or project doc) | Architecture, data model, phases. |

---

## 6. Implementation best practices summary

- **Order:** Follow phase order; respect dependencies (e.g. Auth → Events → Ticket types → Orders → Payments → Tickets).
- **API first:** Define or implement backend contract before or alongside frontend; keep Swagger/OpenAPI up to date.
- **Incremental:** Ship by feature; update FEATURE_STATUS and task files as you go.
- **Secrets:** Env only; no secrets in repo; document required vars in .env.example.
- **Consistency:** One package manager and Node version across team; document in Developer Guide and README.
