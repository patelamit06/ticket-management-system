# UI, Theming & Content – Competitor Audit

Quick comparison of our landing and theme vs. event-ticketing competitors (Eventbrite, Dice, Ticketmaster-style platforms) and what we do well vs. where we can improve.

---

## What we have (current state)

| Area | Our implementation |
|------|--------------------|
| **Theme** | Teal primary, soft cool-gray background, Plus Jakarta Sans headings, Geist body. Light + dark mode. Consistent tokens (primary, muted, accent, border). |
| **Landing structure** | Hero → One platform (website + app) → For everyone (attendees/organizers/check-in/payments) → Why Event Ticketing (browse, checkout, tickets) → Get started CTA → Footer. |
| **Content** | Value-led copy: "One platform," website vs app, for attendees and organizers. Feature cards with icons (Lucide). Clear CTAs: Browse events, Create account. |
| **UI** | Responsive (mobile nav, breakpoints), icon-backed feature cards, hover states, section backgrounds (muted) for separation. |

---

## How competitors typically do it

- **Hero:** Strong one-line value + subline. Often **event imagery or illustrations** (not just type). Primary CTA above the fold (e.g. "Find events" / "Create event").
- **Trust:** **Social proof** (testimonials, "X tickets sold," ratings), **verified/organizer badges**, **payment/security logos** (Stripe, cards, "Secure checkout").
- **Content:** **Outcome-first** ("Sell out your event," "Get tickets in seconds") before feature lists. **Social proof** and **FOMO** (recent sales, sold-out hints) on event pages; we don’t have event pages yet, but the landing can set the tone.
- **Design:** Clean, **image-led** (events, people). Many use **purple/blue or red** as primary; we use **teal** (distinct, still professional). Cards and sections are similar; we’re aligned.
- **Mobile:** Mobile-first, big tap targets, simple nav. We already do this (hamburger, 44px targets, responsive sections).

---

## Verdict

### What’s good (aligned with competitors)

1. **Theme** – Cohesive palette, typography, and tokens. Teal differentiates; light/dark and contrast are in a good place.
2. **Message** – "Website + app" and "for attendees and organizers" is clear and matches how modern platforms position.
3. **Structure** – Hero → value (platform/audience) → features → CTA is a standard, effective pattern.
4. **Responsiveness** – Mobile/tablet/desktop and touch targets are in line with best practices.
5. **Feature cards** – Icons and short copy match competitor “feature block” style; section backgrounds add hierarchy.

### Gaps vs. competitors (recommended improvements)

1. **Trust / credibility**
   - **Missing:** Payment/security line (e.g. "Stripe-powered • Secure checkout") and/or small logos.
   - **Missing:** Any social proof (testimonials, "Used by X organizers," ratings). Even one short quote or stat helps.
   - **Optional:** "Verified" or "Secure" badge near CTAs when we have the backend for it.

2. **Visual richness**
   - **Missing:** Real imagery or illustrations (events, tickets, people). Competitors lean on photos/illustrations; we’re still text + icons only.
   - **Quick win:** Add a small **hero visual** (illustration or abstract graphic) or a **trust strip** (icons + one line) under the hero.

3. **Above-the-fold CTA**
   - We removed hero buttons; nav has "Events" and "Sign up." Competitors often have **one primary CTA in the hero** (e.g. "Browse events" or "Find events"). Consider restoring a single hero CTA for clarity.

4. **Content tone**
   - Slightly more **outcome-focused** lines could help (e.g. "Sell more tickets" for organizers, "Never miss your ticket" for attendees), in addition to current feature-focused copy.

---

## Summary

- **UI and theming:** Solid and comparable to competitors; theme is consistent and responsive.
- **Content:** Clear and well-structured; small shifts toward outcomes and trust would bring it closer to market norms.
- **Biggest gaps:** Trust elements (payment/security, social proof) and visual richness (imagery or illustrations). Adding a short trust line and one hero CTA are low-effort, high-impact next steps.

See **recommended next steps** in IMPLEMENTATION_GUIDE or feature docs if we turn these into tasks.

---

## Pictures and video

### Should you add them?

**Pictures – yes.** Competitors use hero images (crowds, events, tickets) and section imagery. It builds trust and makes the page feel real. Add:
- **Hero:** One strong image (e.g. event crowd, venue, or product screenshot) below or beside the headline.
- **Sections:** Optional images per section (e.g. phone with app, dashboard screenshot) or a single “product in use” strip.

**Video – optional but valuable.** A short (30–90 sec) product walkthrough or “how it works” can boost sign-ups. Add when you have a stable product to show; a placeholder or “See it in action” section is enough until then.

### Where to add

| Place        | Suggestion |
|-------------|------------|
| Hero        | One hero image or illustration (replace or supplement the gradient). Put in `public/` and use Next.js `Image` with `priority`. |
| Mid-page    | One “See it in action” block: embed a YouTube/Vimeo link or a self-hosted `<video>` when ready. |
| Feature row | Optional small images or screenshots in cards; icons alone are fine to start. |

### Tips

- Use **high‑quality, relevant** photos (real events or staged product shots). Avoid generic stock that doesn’t match your product.
- **Optimize:** Next.js `Image` for size and format; keep hero image under ~200 KB where possible.
- **Video:** Prefer a single, short demo. Add captions and a poster image for accessibility and SEO.
