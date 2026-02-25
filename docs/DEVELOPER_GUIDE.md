# Developer Guide

How to work in the Event Management & Ticketing codebase day to day: structure, conventions, and workflows. Use with the [feature folders](features/README.md) and [FEATURE_STATUS.md](FEATURE_STATUS.md).

---

## 1. Repository layout

### Backend (`ticket-backend`)

- **Modules by domain:** `auth`, `users`, `events`, `ticket-types`, `orders`, `payments`, `tickets`, `check-in`, `admin`, `reports`.
- Typical structure per module: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/` (or shared `entities/`).
- **Guards:** `JwtAuthGuard`, `RolesGuard`; resource guards (e.g. event owner, SubUser permission) in service or dedicated guard.
- **Config:** Environment via `ConfigModule`; validation with `class-validator` in DTOs.
- **API docs:** Swagger/OpenAPI at `/api` (or as configured); tag controllers and use `@ApiBody` / `@ApiResponse` where helpful.

### Frontend (`ticket-frontend`)

- **App Router:** `app/` – routes under `app/(public)/`, `app/(dashboard)/`, `app/(admin)/` for layout grouping. Use latest Next.js (e.g. 16) and React 19.
- **Components:** `components/ui/` – shadcn primitives (latest); `components/domain/` – feature components (e.g. `EventCard`, `TicketTypeSelector`). Prefer modular/bento-style layouts and intentional motion; see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) “Modern UI guidance”.
- **Data:** TanStack Query for server state; API client in `lib/api` or similar; types aligned with backend DTOs.
- **Forms:** React Hook Form + Zod; shared schemas in `lib/schemas` or next to feature.
- **Auth:** Middleware for protected routes; role from token/session; redirect to login when unauthenticated.

---

## 2. Setup and run (quick reference)

- **Backend:** `pnpm install` → configure `.env` → `pnpm run migration:run` → `pnpm run start:dev`. See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for full setup.
- **Frontend:** `pnpm install` → `.env.local` with `NEXT_PUBLIC_API_URL` → `pnpm run dev`.
- **API contract:** Backend exposes Swagger; frontend types should match (generate from OpenAPI or maintain by hand). Document in README how to keep them in sync.

---

## 3. Conventions and best practices

### Backend (NestJS)

- **DTOs:** Use `class-validator` (e.g. `IsString`, `IsEmail`, `IsOptional`, `Min`, `Max`) and `class-transformer` where needed. No business logic in DTOs.
- **Controllers:** Thin – parse request, call service, return response. Use appropriate HTTP codes (200, 201, 400, 401, 403, 404).
- **Services:** Business logic and persistence. Inject repository or Prisma/TypeORM service; avoid exposing entities directly in responses when sensitive.
- **Guards:** Use `@UseGuards(JwtAuthGuard, RolesGuard)` and custom resource guards (e.g. “event owner or SubUser with permission”). Return clear 403 messages.
- **Errors:** Use NestJS `HttpException` or filters for consistent error shape; avoid leaking stack traces in production.
- **Idempotency:** For payments and order creation, use idempotency keys or unique constraints so duplicate requests do not create duplicate side effects.

### Frontend (Next.js)

- **Routing:** App Router only. Use layout files for shared UI (dashboard sidebar, admin nav). Group by role: `(public)`, `(dashboard)`, `(admin)`.
- **Data fetching:** Prefer TanStack Query for API calls; use loading and error states; avoid fetching in loops (batch or aggregate on backend).
- **Forms:** React Hook Form + Zod; validate on submit; show field-level errors from Zod or API. Disable submit while submitting.
- **Components:** Prefer small, reusable components. Use shadcn from `components/ui`; compose domain components in `components/domain`. Keep accessibility in mind (labels, focus, keyboard).
- **Auth:** Store JWT securely (httpOnly cookie preferred); send with API client. Middleware checks token and role; redirect or 403 as appropriate.
- **Styling:** Tailwind only; use design tokens (CSS variables) for colors/spacing. Prefer semantic class names (e.g. `text-destructive`) over raw colors.

### API contract

- **REST:** Resource-oriented URLs; plural nouns for collections (`/events`, `/orders`). Use PATCH for partial updates.
- **Auth:** Bearer token in `Authorization` header or cookie as agreed with backend. Include role in token so frontend can guard routes.
- **Errors:** Agree on a common shape (e.g. `{ message, code, errors?: [] }`); frontend handles and displays user-friendly messages.
- **Versioning:** If needed later, use URL prefix (e.g. `/v1/events`) or header; document in Swagger.

---

## 4. How to implement a feature

1. **Pick feature:** Open [FEATURE_STATUS.md](FEATURE_STATUS.md), choose a feature, open its folder under `docs/features/<id>/`.
2. **Read tasks:** Use `backend-tasks.md` and `frontend-tasks.md`; implement in dependency order (usually backend first or both in parallel).
3. **Use smart prompts:** Copy from `smart-prompts.md` into Cursor (or other AI); add paths or file names; run to generate or refine code. Adjust prompt for subtasks (e.g. “add only DTOs”).
4. **Update status:** Mark tasks Done in the feature folder; when feature is complete, update FEATURE_STATUS.md (Overall, Frontend, Backend).
5. **Test:** Manual smoke test; add or run unit/integration tests if the project has them. See Testing below.
6. **API alignment:** Ensure new endpoints are in Swagger and frontend types match (regenerate or update types).

---

## 5. Testing

- **Backend:** Unit tests for services (mock repositories); e2e tests for critical flows (auth, create order, payment webhook). Use Jest; run with `pnpm run test` / `pnpm run test:e2e`.
- **Frontend:** Component tests (e.g. React Testing Library) for forms and critical UI; e2e (e.g. Playwright) for login, browse event, checkout flow. Run with `pnpm run test` / `pnpm run test:e2e`.
- **Best practice:** Test behavior, not implementation; keep tests fast and stable; run in CI on push or PR.

---

## 6. Security, performance, and accessibility

### Security

- **Backend:** Validate all inputs (DTOs); never trust client for authorization (always check role and resource ownership). Use parameterized queries (ORM does this); avoid raw SQL with concatenation. Rate limit auth and payment endpoints in production.
- **Frontend:** Do not store secrets; use env for `NEXT_PUBLIC_*` only for non-sensitive config. Sanitize or escape user-generated content if rendered as HTML.
- **Auth:** Strong JWT secret; sensible expiry; refresh flow if implemented. Use HTTPS in production.

### Performance

- **Backend:** Index DB columns used in filters and joins (e.g. `eventId`, `userId`, `status`). Paginate list endpoints; avoid N+1 (eager load or batch).
- **Frontend:** Lazy load heavy components; optimize images (Next.js Image); use TanStack Query caching and stale-while-revalidate. Minimize client bundle (code split by route).

### Accessibility

- Use semantic HTML and ARIA where needed; associate labels with inputs; ensure focus order and keyboard navigation. Prefer shadcn components that are built with accessibility in mind and fix any gaps (e.g. focus trap in modals).

---

## 7. References

| Document | Purpose |
|----------|---------|
| [FEATURE_STATUS.md](FEATURE_STATUS.md) | Feature list and status. |
| [features/](features/README.md) | Per-feature tasks and smart prompts. |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | Order of work, setup, deployment. |
| [GAPS_AND_ASSUMPTIONS.md](GAPS_AND_ASSUMPTIONS.md) | Requirements and decisions. |

---

## 8. Best practices summary

- **Structure:** Follow existing module and folder layout; one feature per feature folder; update FEATURE_STATUS when done.
- **Conventions:** DTOs + validation on backend; thin controllers, logic in services; guards for auth and resources. Frontend: App Router, TanStack Query, RHF + Zod, Tailwind + shadcn.
- **Contract:** Keep API documented (Swagger) and frontend types in sync; agree on error shape and auth method.
- **Quality:** Validate inputs; authorize on every request; test critical paths; consider security, performance, and accessibility as you build.
