# Feature folders

Each feature has its own folder with:

- **frontend-tasks.md** – Frontend task checklist and status (Not started / In progress / Done)
- **backend-tasks.md** – Backend task checklist and status
- **smart-prompts.md** – Ready-to-use prompts for development (context, stack, acceptance criteria)

The **status file** for all features is [FEATURE_STATUS.md](../FEATURE_STATUS.md). Update it and the task files as you progress.

**Guides:** [IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md) (order of work, env setup, deployment) · [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) (conventions, how to implement a feature, testing, security)

## Folder list

| Id | Folder | Description |
|----|--------|-------------|
| _template | [_template](_template/) | Copy for new features |
| 01 | [01-project-setup](01-project-setup/) | Backend + frontend repo setup |
| 02 | [02-authentication](02-authentication/) | Auth (register, login, JWT) |
| 03 | [03-users-and-roles](03-users-and-roles/) | Users & roles, Super Admin user management |
| 04 | [04-events-crud](04-events-crud/) | Events CRUD, public list/detail |
| 05 | [05-ticket-types](05-ticket-types/) | Ticket types per event |
| 06 | [06-orders-cart](06-orders-cart/) | Orders & cart |
| 07 | [07-payments-stripe](07-payments-stripe/) | Stripe payments |
| 08 | [08-tickets-qr](08-tickets-qr/) | Tickets & QR, My tickets |
| 09 | [09-organizer-dashboard](09-organizer-dashboard/) | Organizer dashboard (basic) |
| 10 | [10-check-in](10-check-in/) | QR check-in |
| 11 | [11-sub-users](11-sub-users/) | Sub-users / Co-ordinators |
| 12 | [12-sales-reports](12-sales-reports/) | Sales dashboard & CSV/PDF export |
| 13 | [13-admin-dashboard](13-admin-dashboard/) | Super Admin dashboard |
| 14 | [14-approval-payouts](14-approval-payouts/) | Event/user approval & payouts |
| 15 | [15-notifications](15-notifications/) | Email (order, ticket, reminder) |
| 16 | [16-discount-codes](16-discount-codes/) | Discount codes at checkout |

## Using smart prompts

Copy a prompt from `smart-prompts.md` into your AI assistant (e.g. Cursor), add the path to the current feature folder or file, and run. Adjust the prompt if you need a subtask (e.g. “implement only the backend DTOs for this feature”).
