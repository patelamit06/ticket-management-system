# Smart prompts – Project setup

Use these when creating the backend and frontend repos from scratch.

---

## Backend repo

```
Create a new NestJS application (use latest stable, e.g. NestJS 11) with TypeScript for an Event Management & Ticketing API. Include: PostgreSQL with TypeORM or Prisma; Swagger/OpenAPI; global validation pipe; skeleton modules for auth, users, events, ticket-types, orders, payments, tickets, check-in, admin, reports. Add a health check endpoint. Use environment variables for DB URL and port. Provide a README with install, migrate, and run commands.
```

---

## Frontend repo

```
Create a new Next.js application (use latest stable, e.g. Next.js 16) with App Router and TypeScript for an Event Ticketing frontend. Include: Tailwind CSS; shadcn/ui initialized with Button, Card, Input, Form components; folder structure components/ui and components/domain; React Hook Form and Zod; TanStack Query; env config for API base URL. Use CSS variables for theme. Provide a README with install and run commands.
```

---

## Both repos (contract alignment)

```
We have a NestJS backend and Next.js 15 frontend in separate repos. The backend exposes REST API with Swagger. Ensure the frontend API client types match the backend DTOs; document in README that API types should be kept in sync (e.g. generate from OpenAPI or copy DTO shapes).
```
