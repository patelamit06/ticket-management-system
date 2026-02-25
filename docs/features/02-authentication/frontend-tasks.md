# Frontend tasks – Authentication

**Feature folder:** 02-authentication  
**Status:** Done

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Login page (email, password); form validation with Zod | Done |
| 2 | Register page (name, email, **phone with country code**, password, confirm password); validation | Done |
| 3 | API client: login, register (name, phone), fetchMe, apiWithAuth | Done |
| 4 | Store JWT (localStorage + cookie); auth context (setUser, fetchMe) | Done |
| 5 | Auth middleware: protect /dashboard by token | Done |
| 6 | Redirect unauthenticated only for protected routes; public pages (/, /events, /login, /register) open | Done |
| 7 | Password reset request page (email); optional reset confirmation page | Not started (optional) |
| 8 | Logout and clear session | Done |
| 9 | **Auth modal:** “Log in / Sign up” in header; login/signup tabs; phone country from GET /countries | Done |
| 10 | **Browse/locale countries:** GET /countries/browse, locale context, country selector (header/footer) | Done |
| 11 | Password show/hide on all password fields | Done |

---

## Notes

- Custom JWT in localStorage + cookie. Role in token for future route guards.
- **Attendee signup is optional:** public event link and guest checkout (email + name) do not require login. See GAPS_AND_ASSUMPTIONS (Attendee functions).
