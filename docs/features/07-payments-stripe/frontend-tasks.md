# Frontend tasks – Payments (Stripe)

**Feature folder:** 07-payments-stripe  
**Status:** Not started

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Checkout page: use Stripe Elements or Stripe Checkout; collect payment method | Not started |
| 2 | Call backend to create PaymentIntent; confirm on client with Stripe SDK | Not started |
| 3 | Success URL: order confirmation, show ticket link; failure URL: retry or cart | Not started |
| 4 | Loading and error states; do not double-submit | Not started |

---

## Notes

- Backend creates PaymentIntent and handles webhook; frontend only confirms payment. No card details sent to our backend.
