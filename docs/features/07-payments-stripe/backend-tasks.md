# Backend tasks – Payments (Stripe)

**Feature folder:** 07-payments-stripe  
**Status:** Not started

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Stripe module: config (secret key, webhook secret from env) | Not started |
| 2 | POST /orders/:id/create-payment-intent: create Stripe PaymentIntent, return clientSecret | Not started |
| 3 | Webhook: stripe checkout.session.completed or payment_intent.succeeded; update order to paid, create tickets | Not started |
| 4 | Idempotent webhook (by payment intent id or event id) | Not started |
| 5 | On success: issue tickets (feature 08); optional platform fee (e.g. 5%) | Not started |
| 6 | Multi-country: store buyer/organizer country; tax by country (Stripe Tax or own rules); payouts via Stripe Connect to organizer’s country | Not started |
| 7 | DTOs and Swagger for create-payment-intent | Not started |

---

## Notes

- Multi-country: see [MULTI_COUNTRY_AND_PAYMENTS.md](../../MULTI_COUNTRY_AND_PAYMENTS.md) (payouts by organizer country, tax by country, Stripe Connect).
