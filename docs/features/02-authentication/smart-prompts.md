# Smart prompts – Authentication

---

## Backend

```
Event Management backend (NestJS, TypeScript, PostgreSQL). Implement authentication: User entity (id, email, passwordHash, role, name, createdAt). Auth module with register (bcrypt hash) and login (compare, issue JWT with role). DTOs: RegisterDto, LoginDto with class-validator. Endpoints: POST /auth/register, POST /auth/login. JwtAuthGuard and JWT strategy. Roles: super_admin, organizer, coordinator, attendee. Document in Swagger.
```

---

## Frontend

```
Event Ticketing frontend (Next.js 15, Tailwind, shadcn/ui). Implement auth: Login and Register pages with React Hook Form + Zod. Call POST /auth/register and POST /auth/login; store JWT (httpOnly cookie or secure storage). Auth middleware to protect /dashboard, /admin, /my-tickets and redirect unauthenticated to /login. Logout and redirect. Use existing Button, Input, Form components.
```

---

## Full feature

```
Implement full authentication for Event Management app. Backend: NestJS auth module (register, login, JWT with role). Frontend: Next.js login/register pages, JWT storage, route protection by role. See docs/features/02-authentication/ for task lists. Ensure API contract (request/response) is consistent and documented.
```
