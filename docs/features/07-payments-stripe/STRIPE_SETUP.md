# Stripe setup – payments and payouts

## 1. Ticket payments (Stripe Checkout – no frontend key)

Payment is handled **entirely from the backend** using [Stripe Checkout](https://stripe.com/docs/checkout) (hosted page). The frontend does **not** need a Stripe publishable key or Stripe.js.

- **Create order:** `POST /orders` with `eventId`, `items: [{ ticketTypeId, quantity }]`, and for guests `guestEmail`, `guestName`.
- **Create Checkout Session:** `POST /payments/orders/:orderId/checkout-session` with body `{ successUrl, cancelUrl }` (full URLs). Returns `{ url }`. Frontend redirects the user to `url`; the user pays on Stripe’s hosted page and is sent back to `successUrl` or `cancelUrl`.
- **Webhook:** Configure your Stripe Dashboard to send **payment_intent.succeeded** (and optionally **payment_intent.payment_failed**) to `https://your-api/payments/webhook/stripe`. Use **STRIPE_WEBHOOK_SECRET** (signing secret) to verify the payload. Checkout creates a PaymentIntent with `metadata.orderId`; when payment succeeds, the existing webhook marks the order paid and creates tickets.

**Optional (custom UI):** `POST /payments/orders/:orderId/create-payment-intent` returns `{ clientSecret }` for use with [Stripe Elements](https://stripe.com/docs/payments/elements) on the frontend; that flow requires the Stripe publishable key and `@stripe/react-stripe-js` on the frontend.

### Environment

- **STRIPE_SECRET_KEY** – Secret key (e.g. `sk_test_...` for test).
- **STRIPE_WEBHOOK_SECRET** – Webhook signing secret (e.g. `whsec_...`) from Stripe Dashboard → Developers → Webhooks.

The backend preserves the raw request body for the webhook route so signature verification works. Do not disable or replace the global JSON body parser for other routes.

### Local webhook testing

Use [Stripe CLI](https://stripe.com/docs/stripe-cli):  
`stripe listen --forward-to localhost:3001/payments/webhook/stripe`  
and set **STRIPE_WEBHOOK_SECRET** to the secret the CLI prints.

---

## 2. Organizer payouts (Stripe Connect)

- **Goal:** A share of each ticket sale goes to the platform (e.g. 5%), the rest to the organizer’s bank account in their country.
- **How:** Each organizer has a Stripe **Connected Account** (Express or Standard). Store the Connected Account ID on the user: **User.stripeConnectAccountId** (e.g. `acct_xxx`).

### Flow

1. **Onboarding:** Use [Stripe Connect onboarding](https://stripe.com/docs/connect/express-accounts) to create and link a Connected Account for the organizer. After onboarding, save the returned `account.id` (or `stripe_account_id`) to **User.stripeConnectAccountId** (e.g. via a callback or webhook).
2. **Creating the PaymentIntent:** When creating the PaymentIntent for an order, the backend already:
   - Loads the event’s organizer and their **stripeConnectAccountId**.
   - If present, creates a **destination charge**: `transfer_data.destination = organizerStripeConnectAccountId` and `application_fee_amount` = 5% of the amount (platform fee). The rest is transferred to the Connected Account.
3. **Payouts:** Stripe automatically pays out to the Connected Account according to the account’s payout schedule (Dashboard or API). No extra “payout” call is required for the organizer; the transfer happens when the payment succeeds.

### If organizer has no Connected Account

If **User.stripeConnectAccountId** is null, the PaymentIntent is created **without** `transfer_data` and `application_fee_amount`. The full amount is captured on the platform account. You can:

- Restrict publishing events until the organizer has completed Connect onboarding, or
- Allow sales and run payouts manually (e.g. bank transfer), or
- Run a job that creates and attaches a Connected Account and backfills the field.

### Storing the Connected Account ID

- **Express / Standard:** After Connect onboarding (e.g. Account Links or OAuth), Stripe redirects or returns the account ID. Your backend endpoint that handles the redirect or webhook should update the user:  
  `UPDATE users SET stripe_connect_account_id = $1 WHERE id = $2`.
- **Webhook:** You can also listen to `account.updated` and store the account ID when the account is ready for charges.

---

## 3. Summary

| Item | Action |
|------|--------|
| **Payments** | Create order → create PaymentIntent with clientSecret → confirm on frontend with Stripe.js/Elements → webhook marks order paid and creates tickets. |
| **Payouts** | Onboard organizers with Stripe Connect; set **User.stripeConnectAccountId**. PaymentIntents then use destination charge + application_fee (5%); Stripe pays out to the Connected Account. |
| **Idempotency** | Webhook handler ignores **payment_intent.succeeded** if the order is already **paid**. |
| **Platform fee** | 5% of the charge; configurable in `payments.service.ts` (`PLATFORM_FEE_PERCENT`). |
