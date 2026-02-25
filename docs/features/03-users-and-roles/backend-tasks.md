# Backend tasks – Users & roles

**Feature folder:** 03-users-and-roles  
**Status:** Not started

**Eventbrite-style:** Stored roles are `super_admin | coordinator | attendee`. “Organizer” is not a signup role—it means event owner (user who created events, i.e. event.organizerId). Admin assigns coordinator and super_admin only; no need to assign “organizer” for creating events.

---

## Role model (decided – see GAPS_AND_ASSUMPTIONS Decisions log)

- **One account type:** Any registered user can create events; no separate organizer signup.
- **Stored roles (DB):** `super_admin` | `coordinator` | `attendee`. Default at signup: **attendee**.
- **Organizer** = event owner (e.g. `event.organizerId`), **not** a role we assign. Admin never assigns organizer; creating an event makes the user the owner.
- **Admin (super_admin) only:** List users, change role to coordinator/super_admin, suspend. No "make organizer" action.

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Users module: GET /users/me (profile), PATCH /users/me | Not started |
| 2 | Super Admin: GET /admin/users (list, filter, paginate), PATCH /admin/users/:id (role, suspend) | Not started |
| 3 | Guards: only super_admin for admin user routes | Not started |
| 4 | DTOs and Swagger for user endpoints | Not started |
