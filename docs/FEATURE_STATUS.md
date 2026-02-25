# Event Management & Ticketing System – Feature Status

Single source of truth for all features and their implementation status. Update this file and each feature folder as work progresses.

**Status values:** `Not started` | `In progress` | `Done` | `Blocked`

**Last updated:** 2025-02-16

**See also:** [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) (order of work, setup, deployment) · [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) (conventions, structure, workflows)

---

## Overview

| # | Feature | Phase | Overall status | Frontend | Backend |
|---|---------|--------|----------------|----------|---------|
| 1 | [Project setup](#1-project-setup) | 1 | Done | Done | Done |
| 2 | [Authentication](#2-authentication) | 1 | Done | Done | Done |
| 3 | [Users & roles](#3-users--roles) | 1 | Not started | Not started | Not started |
| 4 | [Events CRUD](#4-events-crud) | 1 | Not started | Not started | Not started |
| 5 | [Ticket types](#5-ticket-types) | 1 | Not started | Not started | Not started |
| 6 | [Orders & cart](#6-orders--cart) | 2 | Not started | Not started | Not started |
| 7 | [Payments (Stripe)](#7-payments-stripe) | 2 | Not started | Not started | Not started |
| 8 | [Tickets & QR](#8-tickets--qr) | 2 | Not started | Not started | Not started |
| 9 | [Organizer dashboard (basic)](#9-organizer-dashboard-basic) | 2 | Not started | Not started | Not started |
| 10 | [Check-in (QR scan)](#10-check-in-qr-scan) | 3 | Not started | Not started | Not started |
| 11 | [Sub-users / Co-ordinators](#11-sub-users--co-ordinators) | 3 | Not started | Not started | Not started |
| 12 | [Sales dashboard & reports export](#12-sales-dashboard--reports-export) | 3 | Not started | Not started | Not started |
| 13 | [Super Admin dashboard](#13-super-admin-dashboard) | 4 | Not started | Not started | Not started |
| 14 | [Event/user approval & payouts](#14-eventuser-approval--payouts) | 4 | Not started | Not started | Not started |
| 15 | [Notifications (email)](#15-notifications-email) | 5 | Not started | Not started | Not started |
| 16 | [Discount codes](#16-discount-codes) | 5 | Not started | Not started | Not started |

---

## Feature list (with folder links)

Each feature has a folder under `docs/features/<feature-id>/` with:

- **frontend-tasks.md** – Frontend task checklist and status
- **backend-tasks.md** – Backend task checklist and status
- **smart-prompts.md** – Ready-to-use development prompts (context, acceptance criteria, stack)

### 1. Project setup

- **Folder:** [features/01-project-setup](features/01-project-setup/)
- **Scope:** Backend repo (NestJS, PostgreSQL, base modules); Frontend repo (Next.js 15, Tailwind, shadcn/ui, App Router). OpenAPI/Swagger for API contract.

### 2. Authentication

- **Folder:** [features/02-authentication](features/02-authentication/)
- **Scope:** Register, login, JWT issue/refresh, password reset. Frontend: login/register pages, auth middleware, protected routes.
- **Done:** Register (name, email, password, **phone with country code** from master API), login, JWT, auth modal, locale + phone country APIs, password show/hide. **Not done:** Password reset (optional).

### 3. Users & roles

- **Folder:** [features/03-users-and-roles](features/03-users-and-roles/)
- **Scope:** User CRUD, role (super_admin | organizer | coordinator | attendee). Super Admin: list users, change roles, suspend. Profile page.

### 4. Events CRUD

- **Folder:** [features/04-events-crud](features/04-events-crud/)
- **Scope:** Create/edit event (name, description, location, date/time, banner). Publish/unpublish. Public event list and event detail page.

### 5. Ticket types

- **Folder:** [features/05-ticket-types](features/05-ticket-types/)
- **Scope:** CRUD ticket types per event (name, price, quantity, maxPerOrder, availability). Free/Child/Youth/Adult. Organizer UI to manage ticket types.

### 6. Orders & cart

- **Folder:** [features/06-orders-cart](features/06-orders-cart/)
- **Scope:** Add to cart, reserve inventory (TTL), create order. One event per order (v1). Cart and checkout flow (before payment).

### 7. Payments (Stripe)

- **Folder:** [features/07-payments-stripe](features/07-payments-stripe/)
- **Scope:** Stripe PaymentIntent, webhook for success/failure, update order and ticket status. Checkout UI with Stripe Elements or Checkout.

### 8. Tickets & QR

- **Folder:** [features/08-tickets-qr](features/08-tickets-qr/)
- **Scope:** Issue ticket (unique code, QR payload) after payment. “My tickets” page, QR display, optional PDF download.

### 9. Organizer dashboard (basic)

- **Folder:** [features/09-organizer-dashboard](features/09-organizer-dashboard/)
- **Scope:** Dashboard home, list of events, attendees list per event, basic sales counts. Route protection for organizer role.

### 10. Check-in (QR scan)

- **Folder:** [features/10-check-in](features/10-check-in/)
- **Scope:** Validate QR (code/token), mark ticket used, AttendanceLog. Web check-in UI for organizer/co-ordinator. Permission: canScanOnly.

### 11. Sub-users / Co-ordinators

- **Folder:** [features/11-sub-users](features/11-sub-users/)
- **Scope:** Organizer creates SubUsers; permissions (canScanOnly, canViewAttendees, canEditEvent); optional event scope. Co-ordinator UI and access control.

### 12. Sales dashboard & reports export

- **Folder:** [features/12-sales-reports](features/12-sales-reports/)
- **Scope:** Sales by event, by ticket type, trends (daily/weekly/monthly). CSV/PDF export. Charts (e.g. recharts) and DataTable.

### 13. Super Admin dashboard

- **Folder:** [features/13-admin-dashboard](features/13-admin-dashboard/)
- **Scope:** Platform-wide revenue, tickets by event, top events, trends. Admin routes and role guard.

### 14. Event/user approval & payouts

- **Folder:** [features/14-approval-payouts](features/14-approval-payouts/)
- **Scope:** Super Admin approve/suspend events and users. Payouts and disputes (data model + basic CRUD). Optional Stripe Connect for organizer payouts.

### 15. Notifications (email)

- **Folder:** [features/15-notifications](features/15-notifications/)
- **Scope:** Order confirmation email, ticket email, optional reminder (e.g. 24h before event). SendGrid or Resend integration.

### 16. Discount codes

- **Folder:** [features/16-discount-codes](features/16-discount-codes/)
- **Scope:** Create discount codes (percentage or fixed), expiry and usage limit. Apply at checkout (backend + frontend).

---

## How to use

1. **Update status:** Set overall and frontend/backend status in the table and in each feature’s `frontend-tasks.md` / `backend-tasks.md`.
2. **Development:** Use `smart-prompts.md` in the feature folder to prompt AI or brief developers (context, stack, acceptance criteria).
3. **Track tasks:** Check off tasks in the feature folder; keep FEATURE_STATUS.md in sync when a feature is done or blocked.
4. **Order and conventions:** For implementation order and env setup see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md); for code structure and workflows see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md). Full doc index: [README.md](README.md).

---

## Suggested next

- **Feature 3 – Users & roles:** User CRUD, profile page, role management (super_admin list/change roles). Backend already has User model and JWT with role; frontend has auth context and middleware. Proceed with [features/03-users-and-roles](features/03-users-and-roles/).
- **Feature 4 – Events CRUD:** Create/edit events, publish, public list and detail. Good follow-on after or in parallel with roles. See [features/04-events-crud](features/04-events-crud/).
