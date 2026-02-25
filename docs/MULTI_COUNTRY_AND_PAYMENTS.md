# Multi-country support, payouts and tax

The platform supports **multiple countries**: organizers and attendees can be in different countries. Organizers receive **payouts in their country**, and **tax is applied depending on country** so rules stay simple per jurisdiction.

---

## 1. How the system detects country and shows events

### How we know the attendee’s country

- **User profile (source of truth):** The attendee sets their **country** when registering or in their profile (e.g. dropdown or typeahead). Stored on the **User** entity as `country` (e.g. ISO code: `US`, `IN`, `DE`). Use this for tax, payouts, and any default event filter.
- **Optional: detect from IP:** You can infer country from the visitor’s IP (GeoIP API or header like Cloudflare’s `CF-IPCountry`). Use only to **pre-fill** the country for new users or to suggest “Events in your country”. Do not rely on it alone for tax or legal (VPNs can make it wrong). Once the user sets a country in their profile, use that.
- **Result:** Attendee country = **User.country** from profile; IP is optional for hints only.

### How an event is “for” a specific country

- **Set by organizer when creating the event:** In the event creation form, the organizer selects the event’s **country** (and optionally **city** or region). Stored on the **Event** entity as `country` (and optional `city`, `timezone`).
- **Meaning:** The event is tied to that country for listing (filter by country), tax, and payouts. One event = one country in the basic design.
- **Result:** Event country = **Event.country** (and optional city) set by the organizer at creation.

### How events are shown to attendees

- **Default:** The event list shows **all** published events (e.g. upcoming). No automatic restriction by country.
- **Filter by country:** Attendees can **filter** by **country** (and optionally city). Backend: e.g. `GET /events?country=IN` returns only events where `event.country === 'IN'`. Use **Event.country** (and Event.city) for this.
- **Optional “events in your country” default:** If the user is logged in and has **User.country** set, you can default the list to that country (e.g. “Events in your country”) and provide a control to “Show all countries” or change country.
- **Result:** Show all events by default; filter by **event country** (and city). Optionally default the filter to the **attendee’s profile country** for a local-first experience.

---

## 2. Multi-country in the product (data and currency)

- **Users and events** can be in any supported country. Store **country** (and optionally timezone) on User and Event so you can:
  - Show “current” or upcoming events (and optionally filter by country/region).
  - Apply the right tax and payout rules per organizer/event.
- **Currencies:** Either one platform currency for v1, or **currency per event/organizer** (e.g. event priced in organizer’s currency). Stripe supports multi-currency PaymentIntents.
- **UI:** Single language is fine for v1; add i18n later if you need localized copy per country.

---

## 3. Payouts by organizer country

- **Goal:** Organizers get paid in **their country** (their bank, their currency), so payouts and local compliance are straightforward.
- **How:** Use **Stripe Connect**. Each organizer has a **Connected Account** (Express or Custom) in their country. After a sale:
  - Platform keeps the fee (e.g. 5%).
  - Remaining amount is **transferred** to the organizer’s Connected Account.
  - Stripe handles payouts to the organizer’s local bank and compliance (e.g. KYC) per country.
- **Data:** Store organizer’s **country** and **Stripe Connect account ID** (e.g. on User or OrganizerProfile). On payout, transfer to that Connected Account; Stripe settles in the account’s country/currency.
- **Result:** Payout logic is “by organizer country” because each organizer is tied to a Connected Account in that country; tax can then be applied per country as below.

---

## 4. Tax depending on country

- **Goal:** Apply tax (VAT, GST, etc.) **depending on country** so you can easily follow local rules (e.g. EU VAT, India GST).
- **Options:**
  - **Stripe Tax:** Stripe can calculate tax by buyer/seller location; you send customer and seller address/country and Stripe returns tax amount. Integrate with your checkout and store tax on the order.
  - **Own rules:** Store **country** on User (attendee) and Event/Organizer (seller). In Payments module, use a small **tax service** that returns rate or amount by (buyer country, seller country, event type if needed). Apply that at order creation and store tax amount and country on Order.
- **Data:** Order (or OrderItem) should store: `taxAmount`, `taxCountry` (or `buyerCountry` / `sellerCountry`) so reporting and invoices are clear.
- **Result:** Tax is “by country” so you can keep one set of rules per country and plug in Stripe Tax or your own matrix later.

---

## 5. Summary for implementation

| Area | What to do |
|------|------------|
| **Data** | Add `country` (and optional `timezone`) to User and Event; add `currency` to Event if multi-currency. Store organizer’s Stripe Connect account ID. On Order: `currency`, `taxAmount`, `taxCountry` (or buyer/seller country). |
| **Payments** | Create PaymentIntent in event/organizer currency; optionally collect buyer country for tax. After payment, transfer to organizer’s Connected Account (Stripe Connect). |
| **Payouts** | Use Stripe Connect transfers to the organizer’s Connected Account (their country). No need to manage local bank details per country yourself. |
| **Tax** | Use Stripe Tax or a per-country tax service; calculate at checkout; store tax amount and country on Order. |

---

## 6. References

- **Assumptions:** [GAPS_AND_ASSUMPTIONS.md](GAPS_AND_ASSUMPTIONS.md) (Payments / multi-country).
- **Stripe:** [Stripe Connect](https://stripe.com/docs/connect), [Stripe Tax](https://stripe.com/docs/tax), [Multi-currency](https://stripe.com/docs/currencies).
