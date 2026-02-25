# Smart prompts – Users & roles

**Role model (decided):** Stored roles = super_admin | coordinator | attendee (default). “Organizer” = event owner (organizerId), not a role. Admin does not assign organizer. See backend-tasks.md / frontend-tasks.md and GAPS_AND_ASSUMPTIONS Decisions log.

**Backend:** NestJS Users module: GET /users/me, PATCH /users/me. Admin: GET /admin/users (list, filter, paginate), PATCH /admin/users/:id (role, suspended). RolesGuard for super_admin. DTOs and Swagger.

**Frontend:** Next.js profile page; Super Admin users list (table, filters), change role and suspend with confirmation. Role-based nav (admin only for super_admin). See docs/features/03-users-and-roles/ for full task lists.
