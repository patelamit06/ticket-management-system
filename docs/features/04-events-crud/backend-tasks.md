# Backend tasks – Events CRUD

**Feature folder:** 04-events-crud  
**Status:** Not started

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Event entity: name, description, location, startDate, endDate, bannerUrl, status, organizerId, **country** (optional city, timezone) | Not started |
| 2 | Events module: POST, PATCH, GET /events (any authenticated user can POST/create; event owner can PATCH/GET own); GET /events/public (published only, list/detail); query **country** (and city) for filtering | Not started |
| 3 | Status: draft | pending_approval | published | cancelled | Not started |
| 4 | Resource guard: any authenticated user can create event (becomes owner); only event owner (organizerId = userId) or super_admin can update/delete event | Not started |
| 5 | DTOs and Swagger; optional file upload for banner | Not started |
