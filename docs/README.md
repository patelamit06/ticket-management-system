# Documentation index

Central index for the Event Management & Ticketing System docs. Start here to find guides, status, and feature-level tasks.

---

## Guides

| Document | Purpose |
|----------|---------|
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | How to build and ship: implementation order, environment setup, deployment, best practices. |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | How to work in the codebase: structure, conventions, workflows, testing, security, and accessibility. |

---

## Planning and status

| Document | Purpose |
|----------|---------|
| [FEATURE_STATUS.md](FEATURE_STATUS.md) | All features and status (overall, frontend, backend); links to feature folders. |
| [GAPS_AND_ASSUMPTIONS.md](GAPS_AND_ASSUMPTIONS.md) | Requirements gaps, proposed assumptions, and decisions log. |
| [MULTI_COUNTRY_AND_PAYMENTS.md](MULTI_COUNTRY_AND_PAYMENTS.md) | Multi-country support, payouts by organizer country (Stripe Connect), and tax by country. |

*(GAPS_AND_ASSUMPTIONS.md also includes an "Additional considerations" checklist: scope, legal, technical, UX, security, and out-of-scope items.)*

---

## Feature-level docs

| Location | Purpose |
|----------|---------|
| [features/](features/README.md) | Per-feature folders: frontend-tasks.md, backend-tasks.md, smart-prompts.md. |

Use [FEATURE_STATUS.md](FEATURE_STATUS.md) to find a feature, then open its folder under `features/<feature-id>/` for tasks and development prompts.

---

## Current status and next

- **Done:** Project setup (01), Authentication (02) – backend and frontend. See [FEATURE_STATUS.md](FEATURE_STATUS.md) for the full table and the “Suggested next” section at the bottom.
- **Suggested next:** Feature 3 (Users & roles) or Feature 4 (Events CRUD). Use the feature folder’s `smart-prompts.md` and task lists to continue.

---

## Other

- **Implementation plan** – High-level architecture, data model, and phases live in the Cursor plan (or your project doc). This index and the guides reference that plan; [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) maps phases to feature IDs.
