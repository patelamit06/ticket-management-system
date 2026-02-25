# Frontend tasks – Users & roles

**Feature folder:** 03-users-and-roles  
**Status:** Not started

---

## Role model (decided – see GAPS_AND_ASSUMPTIONS Decisions log)

- **Default role:** Attendee. Any user can create events (they become event owner; no “organizer” role to assign).
- **UI:** Show “Create event” / dashboard for any logged-in user; restrict admin (users list, change role, suspend) to super_admin only.

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Profile page: view/edit name, email, **country** (organizer/attendee; used for event filter default and tax) | Not started |
| 2 | Super Admin: users list (table), filters, pagination | Not started |
| 3 | Super Admin: change user role, suspend user (with confirmation) | Not started |
| 4 | Role-based UI: show/hide nav and actions by role | Not started |

---

## Notes

- Reuse DataTable, Dialog, Select from shadcn. Guard admin routes. **User.country** is used for “events in your country” default and tax; see [MULTI_COUNTRY_AND_PAYMENTS.md](../../MULTI_COUNTRY_AND_PAYMENTS.md).
