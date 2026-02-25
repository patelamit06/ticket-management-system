# Backend tasks – Orders & cart

**Feature folder:** 06-orders-cart  
**Status:** Not started

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Order entity: userId (nullable for guest), eventId, status, totalAmount, paymentIntentId, **guestEmail**, **guestName** | Not started |
| 2 | OrderItem entity: orderId, ticketTypeId, quantity, priceAtPurchase | Not started |
| 3 | POST /orders: create order (pending), reserve inventory (TTL); accept either authenticated user or guest (email + name) | Not started |
| 4 | GET /orders (my orders when logged in); GET /orders/:id (owner or guest via orderId + email or signed link) | Not started |
| 5 | Idempotency or guard against double submit | Not started |
| 6 | DTOs and Swagger | Not started |
