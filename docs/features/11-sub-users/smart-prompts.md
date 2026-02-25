# Smart prompts – Sub-users / Co-ordinators

**Backend:** NestJS SubUser relation (organizerId, userId, canScanOnly, canViewAttendees, canEditEvent, optional eventIds). CRUD for organizer. Use in CheckIn and event/attendees access. DTOs and Swagger.

**Frontend:** Organizer: list/add SubUsers, set permissions. Co-ordinator: limited dashboard and nav by permission; check-in and view attendees where allowed. See docs/features/11-sub-users/ and GAPS_AND_ASSUMPTIONS.md.
