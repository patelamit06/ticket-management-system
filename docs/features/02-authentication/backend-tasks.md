# Backend tasks – Authentication

**Feature folder:** 02-authentication  
**Status:** Done

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | User entity: id, email, passwordHash, role, name, **phone**, createdAt, country (optional) | Done |
| 2 | Auth module: register (hash password, bcrypt), login (compare, issue JWT) | Done |
| 3 | JWT strategy: sign with role; validate on protected routes | Done |
| 4 | DTOs: RegisterDto (name, phone required), LoginDto; validation (email, password strength) | Done |
| 5 | Endpoints: POST /auth/register, POST /auth/login, GET /auth/me; optional refresh, forgot-password | Done (me done; refresh/forgot not done) |
| 6 | Guards: JwtAuthGuard, optional RolesGuard | Done (JwtAuthGuard) |
| 7 | Swagger tags and response types for auth endpoints | Done |
| 8 | **Countries master:** Country model (dialCode, name, isoCode), GET /countries (phone), GET /countries/browse (locale), seed | Done |

---

## Notes

- Roles: super_admin | organizer | coordinator | attendee. Include role in JWT payload. Eventbrite-style: one account; “organizer” = event owner, not a stored role.
