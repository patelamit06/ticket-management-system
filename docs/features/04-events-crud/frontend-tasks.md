# Frontend tasks – Events CRUD

**Feature folder:** 04-events-crud  
**Status:** Not started

**Eventbrite-style:** Any authenticated user can create and manage their own events (no “organizer role” required). “Organizer” = user who created the event.

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Public: events list page (cards/grid), search and filters (date, location, **country** and optional city) | Not started |
| 2 | Public: event detail page (name, description, location, date, banner image) | Not started |
| 3 | Organizer: create event form (name, description, location, start/end datetime, **country** and optional city, banner upload) | Not started |
| 4 | Organizer: edit event, publish/unpublish | Not started |
| 5 | Organizer: my events list in dashboard | Not started |
| 6 | Reusable EventCard component | Not started |

---

## Notes

- Banner: upload to storage or base64; backend stores URL. Protect organizer routes.
- Event **country** (and optional city): set by organizer at creation; used for filtering and multi-country/tax. See [MULTI_COUNTRY_AND_PAYMENTS.md](../../MULTI_COUNTRY_AND_PAYMENTS.md) (section 1).
