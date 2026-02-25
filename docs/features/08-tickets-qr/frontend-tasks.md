# Frontend tasks – Tickets & QR

**Feature folder:** 08-tickets-qr  
**Status:** Not started

---

## Tasks

| # | Task | Status |
|---|------|--------|
| 1 | My tickets page: list orders with tickets; expand to show QR per ticket | Not started |
| 2 | Display QR code (encode ticket code or token; use qrcode lib or similar) | Not started |
| 3 | Optional: PDF download for ticket(s) | Not started |
| 4 | Order confirmation page after payment: link to My tickets (or guest view link) | Not started |
| 5 | **Guest ticket view:** page reachable via link in email (e.g. /orders/[orderId]?token=... or orderId + email); show tickets and QR without login | Not started |

---

## Notes

- One QR per ticket; backend provides code or signed token. Mobile-friendly so attendee can show at entrance.
- **Guests:** Tickets email contains a link to view tickets (signed token or orderId + email); no account required. See GAPS_AND_ASSUMPTIONS (Attendee functions – signup optional).
