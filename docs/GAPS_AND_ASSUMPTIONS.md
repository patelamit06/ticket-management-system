# Event Management & Ticketing System – Gaps and Assumptions

**Single source of truth:** This file holds gaps, assumptions, a considerations checklist, and the Decisions log. The implementation plan points here; update this file as you confirm or override decisions.

This document captures (1) requirements missing or underspecified in the SRS, and (2) additional considerations (scope, legal, technical, UX, security) to decide on.

**See also:** [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) · [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) · [FEATURE_STATUS.md](FEATURE_STATUS.md). Use the **Decisions log** at the bottom to record confirmed or overridden decisions.

---

## Quick reference

| # | Area | SRS state | Proposed assumption | Status |
|---|------|-----------|---------------------|--------|
| 1 | Event Co-Ordinator / Sub User | Roles named; no permission list | Permissions: scan only, view attendees, edit event; scope per event optional | To confirm |
| 2 | Attendee functions | Not in Section 4 | Signup optional; public event link; guest checkout (email + name); tickets via email link; no seat selection in v1 | To confirm |
| 3 | Payments | Not specified | Stripe; platform % (e.g. 5%); multi-country; payouts by organizer country; tax by country | To confirm |
| 4 | Event approval | “Approve or suspend” | pending_approval → Super Admin approves → publish; optional auto-approve | To confirm |
| 5 | QR and check-in | “Scan QR for attendance” | One QR per ticket; web check-in for organizer/co-ordinator; native app later | To confirm |
| 6 | Notifications | “Automated Emails” | Order + ticket email; optional 24h reminder (SendGrid/Resend) | To confirm |
| 7 | Discount codes | Mentioned | In scope: % or fixed; expiry and usage limit; apply at checkout | To confirm |
| 8 | Seat selection / donations | Not in SRS | Out of scope for v1 | To confirm |
| 9 | Refunds / cancellations | Not in SRS | Out of scope for v1; or: admin-only refund, no self-serve | To confirm |
| 10 | Multi-event cart | Not in SRS | One event per order in v1 (simpler) | To confirm |

---

## Detailed assumptions

### 1 – Event Co-Ordinator / Sub User

SRS lists “Sub User” and “Event Co-Ordinator (With custom privilege)” but no concrete permissions.

**Assumption**: Permissions such as `canScanOnly`, `canViewAttendees`, `canEditEvent`; optional scope per event. If you prefer a single role (e.g. scan only), implementation can be simplified.

---

### 2 – Attendee functions

Section 4 does not list Attendee behaviour.

**Assumption**: **Attendee signup is optional.** Attendees use a **public event link** and can **buy tickets without an account** (guest checkout: email and name at checkout). Event discovery, event detail, add to cart, Stripe checkout. After purchase: confirmation and tickets by email; guest views tickets via **link in email** (e.g. orderId + email or signed link), no login required. Optional: if they register later with same email, link orders to account and show in "My tickets". No seat selection in v1.

---

### 3 – Payments

No provider or fee model in SRS.

**Assumption**: Stripe; platform fee (e.g. 5% per sale). **Multi-country support:** platform operates in multiple countries; organizers receive payouts in their country (e.g. via Stripe Connect so each organizer has a Connected Account in their country). **Tax:** apply tax depending on country (e.g. VAT/GST per country) so tax rules stay simple per jurisdiction. Currency can be per event or per organizer country; Stripe supports multi-currency. See [MULTI_COUNTRY_AND_PAYMENTS.md](MULTI_COUNTRY_AND_PAYMENTS.md) for design details.

---

### 4 – Event approval

Super Admin can “approve or suspend events”.

**Assumption**: New events start as `pending_approval`; Super Admin approves → organizer can set to published. Option to auto-approve for selected organizers.

---

### 5 – QR and check-in

“Platform to scan QR code for attendance.”

**Assumption**: One QR per ticket (unique code or signed token); check-in in same web app by organizer or co-ordinator with scan permission; native check-in app possible later.

---

### 6 – Notifications

“Automated Emails” for tickets and reminders.

**Assumption**: Order confirmation and ticket email; optional reminder (e.g. 24h before event) via SendGrid or Resend.

---

### 7 – Discount codes

SRS mentions discount codes for events/ticket types.

**Assumption**: In scope: create codes (percentage or fixed amount), optional expiry and max uses; apply at checkout.

---

### 8 – Seat selection / donations

Ticketly has these; SRS does not.

**Assumption**: Out of scope for v1; can be added later.

---

### 9 – Refunds / cancellations

Not covered in SRS.

**Assumption**: Either out of scope for v1, or Super Admin / Organizer can mark order cancelled and trigger refund via Stripe (no attendee self-serve).

---

### 10 – Multi-event cart

Not specified.

**Assumption**: One event per order in v1 to keep flows simple; multi-event cart can be added later.

---

## Additional considerations (checklist)

Things the plan or docs do not yet fully specify. For each: add to scope, document as out-of-scope, or defer. Resolve in feature tasks or Decisions log.

- **Scope:** SRS in repo (e.g. SRS.md); Event Co-Ordinator vs Sub User; Child/Youth age (honor system?); cancelled event (refund + email?); sold-out UX; Stripe Connect onboarding for organizers.
- **Legal:** Privacy (GDPR, retention, deletion, policy); Terms of Service; cookie/consent if needed; refund policy (who, when).
- **Technical:** API rate limiting; CORS; banner upload (size, types); password policy; JWT expiry; audit log for admin actions; backup/recovery; staging.
- **UX:** Reservation expired message; timezone for event times; duplicate purchase; email bounces; accessibility (WCAG) if required.
- **Security:** CSRF (cookie auth); sanitize event description (XSS); guest ticket link (signed token – already in plan).
- **Out of scope v1:** Seat selection, donations, multi-event cart, self-serve refund, waitlist, recurring events, promo/affiliate (unless added).
- **Optional docs later:** SRS.md, PRIVACY_AND_LEGAL.md, GO_LIVE_CHECKLIST.md, RUNBOOK.md.

---

## Decisions log

Record confirmed or overridden decisions here. Update the **Status** column in the quick-reference table to “Confirmed” or “Overridden” as you go.

| Date | Area | Decision |
|------|------|----------|
| | | *(Example: Event approval – we will auto-approve all events; no pending_approval.)* |
| | **Eventbrite-style roles** | One account type; any registered user can create events. “Organizer” = event owner (organizerId), not a separate role. Stored roles: super_admin, coordinator, attendee (admin assigns coordinator). |
| | | |
