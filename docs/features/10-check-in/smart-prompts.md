# Smart prompts – Check-in (QR scan)

**Backend:** NestJS CheckIn: POST /check-in/scan with code/token; validate ticket, mark used, log AttendanceLog. Guard: organizer or SubUser with scan permission for event. DTOs and Swagger.

**Frontend:** Check-in page: scan QR (camera or upload) or manual code; call scan API; show result. Event selector limited to user’s events (organizer/co-ordinator). See docs/features/10-check-in/ for task lists.
