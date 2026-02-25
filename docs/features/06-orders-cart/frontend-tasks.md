# Frontend tasks – Orders & cart

**Feature folder:** 06-orders-cart  
**Status:** Not started

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Cart state (context or store): eventId, ticket type + quantity; persist or session | Not started |
| 2 | Cart page: list items, totals; edit quantity; remove item | Not started |
| 3 | Create order (reserve) before payment: POST order with items; **guest checkout**: collect email + name when not logged in; show order summary | Not started |
| 4 | Checkout flow: cart → order creation (guest or logged in) → redirect to payment (feature 07) | Not started |
| 5 | One event per order (v1): clear or block adding from another event | Not started |
| 6 | Public event link: event page and checkout work without login; no redirect to signup | Not started |

---

## Notes

- Reserve inventory with short TTL on backend; order status pending until payment success.
