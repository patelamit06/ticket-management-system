# Backend tasks – Check-in (QR scan)

**Feature folder:** 10-check-in  
**Status:** Not started

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | CheckIn module: POST /check-in/scan (body: code or token) | Not started |
| 2 | Validate code/token; ensure ticket exists, not already used, event matches | Not started |
| 3 | Mark ticket usedAt; create AttendanceLog (ticketId, scannedBy, scannedAt, eventId) | Not started |
| 4 | Guard: only organizer or SubUser with canScanOnly for this event | Not started |
| 5 | Response: success with attendee/ticket info, or 400/404 with message | Not started |
| 6 | DTOs and Swagger | Not started |
