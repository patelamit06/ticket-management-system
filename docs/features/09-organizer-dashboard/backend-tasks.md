# Backend tasks – Organizer dashboard (basic)

**Feature folder:** 09-organizer-dashboard  
**Status:** Not started

**Eventbrite-style:** “Organizer” = event owner (user who created the event). Any authenticated user can access dashboard; data is scoped to events where `organizerId = current user id`. No role check for “organizer”; use event ownership.

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | GET /dashboard/summary or /organizer/stats: events count, total tickets sold, revenue (for current user’s events, i.e. organizerId = userId) | Not started |
| 2 | GET /organizer/events with optional sales counts per event (scope to organizerId = userId) | Not started |
| 3 | GET /events/:eventId/attendees: list of orders/tickets (email, ticket type, quantity, order date) | Not started |
| 4 | Resource guard: only event owner (organizerId = userId) or coordinator with canViewAttendees | Not started |
| 5 | DTOs and Swagger | Not started |
