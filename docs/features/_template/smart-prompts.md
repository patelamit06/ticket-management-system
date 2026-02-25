# Smart prompts – [Feature name]

Use these prompts when implementing this feature (e.g. with Cursor or another AI assistant). Copy and paste, then add file paths or context as needed.

---

## Prompt 1: Backend implementation

```
Context: Event Management & Ticketing System. Backend: NestJS, TypeScript, PostgreSQL (TypeORM or Prisma). 
Feature: [Feature name]. 
Requirements: [Brief requirements].
Tasks: [Link or paste from backend-tasks.md].
Acceptance: DTOs with validation, role/resource guards where needed, Swagger documented. 
Implement the backend for this feature following existing patterns in the codebase.
```

---

## Prompt 2: Frontend implementation

```
Context: Event Management & Ticketing System. Frontend: Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, React Hook Form + Zod, TanStack Query.
Feature: [Feature name].
Requirements: [Brief requirements].
Tasks: [Link or paste from frontend-tasks.md].
Acceptance: Reusable components, proper loading/error states, role-based route protection if needed.
Implement the frontend for this feature following existing patterns.
```

---

## Prompt 3: Full feature (backend + frontend)

```
Context: Event Management & Ticketing System. Backend: NestJS, PostgreSQL. Frontend: Next.js 15, Tailwind, shadcn/ui.
Feature: [Feature name].
See docs/features/[feature-id]/ for backend-tasks.md and frontend-tasks.md.
Implement backend and frontend for this feature; ensure API contract (DTOs, endpoints) is consistent and documented.
```
