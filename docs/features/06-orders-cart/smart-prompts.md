# Smart prompts – Orders & cart

**Backend:** NestJS Orders module. Order + OrderItem entities. POST /orders (pending, reserve inventory TTL), GET /orders and GET /orders/:id. Validate ticket type capacity. DTOs and Swagger.

**Frontend:** Cart (eventId, ticket types + qty); cart page; create order then hand off to payment. One event per order in v1. See docs/features/06-orders-cart/ for task lists.
