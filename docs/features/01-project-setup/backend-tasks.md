# Backend tasks – Project setup

**Feature folder:** 01-project-setup  
**Status:** Done

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Create NestJS app (latest, TypeScript) | Done |
| 2 | Add PostgreSQL connection (TypeORM or Prisma) | Done (Prisma, optional DB_SCHEMA) |
| 3 | Configure environment (DB URL, port, JWT secret placeholder) | Done |
| 4 | Add Swagger/OpenAPI module and base config | Done |
| 5 | Create skeleton modules: auth, users, events, ticket-types, orders, payments, tickets, check-in, admin, reports, **countries** | Done |
| 6 | Add global validation pipe and base DTO patterns | Done |
| 7 | Health check endpoint (e.g. GET /health) | Done (or use root) |
| 8 | README with setup, migrate, and run instructions | Done |

---

## Notes

- Stack: NestJS, TypeScript, PostgreSQL (TypeORM or Prisma), class-validator, Swagger.
- Separate repo (e.g. ticket-backend).
