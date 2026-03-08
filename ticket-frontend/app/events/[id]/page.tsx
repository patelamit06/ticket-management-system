'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Calendar, Clock, User, Share2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { getPublicEvent } from '@/lib/events-api';
import { getPublicTicketTypes } from '@/lib/ticket-types-api';
import { getPublicEventDiscounts } from '@/lib/event-discounts-api';
import { getPublicEventMedia } from '@/lib/event-media-api';
import type { EventPayload } from '@/lib/events-api';
import type { TicketTypePayload } from '@/lib/ticket-types-api';
import type { EventDiscountPayload } from '@/lib/event-discounts-api';
import type { EventMediaPayload } from '@/lib/event-media-api';

function formatDateRange(start: string, end: string, timezone?: string | null): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone ?? undefined,
  };
  const startStr = startDate.toLocaleString(undefined, opts);
  const endStr = endDate.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone ?? undefined });
  const sameDay = startDate.toDateString() === endDate.toDateString();
  return sameDay ? `${startStr} to ${endStr}` : `${startStr} to ${endStr}`;
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} minutes`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hour${h !== 1 ? 's' : ''} ${m} minutes` : `${h} hour${h !== 1 ? 's' : ''}`;
}

function getAgeHighlight(ticketTypes: TicketTypePayload[]): string | null {
  const hasMin = ticketTypes.some((t) => t.ageMin != null);
  const hasMax = ticketTypes.some((t) => t.ageMax != null);
  if (!hasMin && !hasMax) return null;
  const minAge = ticketTypes.reduce((acc, t) => (t.ageMin != null && (acc == null || t.ageMin > acc) ? t.ageMin : acc), null as number | null);
  const maxAge = ticketTypes.reduce((acc, t) => (t.ageMax != null && (acc == null || t.ageMax < acc) ? t.ageMax : acc), null as number | null);
  if (minAge != null && maxAge != null) return `Ages ${minAge}-${maxAge}`;
  if (minAge != null) return `Ages ${minAge}+`;
  if (maxAge != null) return `Ages under ${maxAge}`;
  return null;
}

export default function PublicEventPage() {
  const params = useParams();
  const eventId = typeof params.id === 'string' ? params.id : null;
  const [event, setEvent] = React.useState<EventPayload | null>(null);
  const [ticketTypes, setTicketTypes] = React.useState<TicketTypePayload[]>([]);
  const [discounts, setDiscounts] = React.useState<EventDiscountPayload[]>([]);
  const [media, setMedia] = React.useState<EventMediaPayload[]>([]);
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const descriptionLength = 320;

  React.useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setNotFound(false);
    getPublicEvent(eventId)
      .then((ev) => {
        if (!ev) {
          setNotFound(true);
          setEvent(null);
          return undefined;
        }
        setEvent(ev);
        return Promise.all([
          getPublicTicketTypes(eventId),
          getPublicEventDiscounts(eventId).catch(() => []),
          getPublicEventMedia(eventId).catch(() => []),
        ]);
      })
      .then((result) => {
        if (result) {
          const [types, disc, med] = result;
          setTicketTypes(types);
          setDiscounts(disc);
          setMedia(med);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleShare = React.useCallback(() => {
    if (typeof window === 'undefined' || !eventId) return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: event?.name ?? 'Event', url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => {});
    }
  }, [eventId, event?.name]);

  if (!eventId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          <p className="text-muted-foreground">Invalid event.</p>
          <Link href="/events" className="mt-4 inline-block text-primary hover:underline">
            Browse events
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="h-64 rounded-xl bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
        ) : notFound || !event ? (
          <>
            <p className="text-muted-foreground">Event not found or not published.</p>
            <Link href="/events" className="mt-4 inline-block text-primary hover:underline">
              Browse events
            </Link>
          </>
        ) : (
          <>
            {/* Share */}
            <div className="flex items-center justify-between gap-4">
              <Link href="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                ← Events
              </Link>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Share this event
              </button>
            </div>

            {/* Hero: carousel (if media) or banner + title + by + location + date */}
            {media.length > 0 ? (
              <div className="relative mt-6 overflow-hidden rounded-xl bg-muted shadow-sm">
                <div className="relative aspect-video w-full">
                  {media.map((m, i) => (
                    <div
                      key={m.id}
                      className={`absolute inset-0 transition-opacity duration-300 ${i === carouselIndex ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
                      aria-hidden={i !== carouselIndex}
                    >
                      {m.type === 'image' ? (
                        <img
                          src={m.url}
                          alt={m.caption ?? ''}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <iframe
                          src={m.url}
                          title={m.caption ?? 'Video'}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </div>
                  ))}
                </div>
                {media.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCarouselIndex((i) => (i === 0 ? media.length - 1 : i - 1))}
                      className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Previous"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCarouselIndex((i) => (i === media.length - 1 ? 0 : i + 1))}
                      className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Next"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5">
                      {media.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCarouselIndex(i)}
                          className={`h-2 rounded-full transition-colors ${i === carouselIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'}`}
                          aria-label={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : event.bannerUrl ? (
              <img
                src={event.bannerUrl}
                alt=""
                className="mt-6 aspect-video w-full rounded-xl object-cover shadow-sm"
              />
            ) : null}
            <h1 className="mt-6 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {event.name}
            </h1>
            {event.organizerName && (
              <p className="mt-2 text-sm text-muted-foreground">
                By <span className="font-medium text-foreground">{event.organizerName}</span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {event.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {event.location}
                  {event.city && `, ${event.city}`}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                {formatDateRange(event.startDate, event.endDate, event.timezone)}
              </span>
            </div>

            {/* Overview */}
            {event.description && (
              <section className="mt-8" aria-labelledby="overview-heading">
                <h2 id="overview-heading" className="font-heading text-lg font-semibold text-foreground">
                  Overview
                </h2>
                <div className="mt-3 text-muted-foreground">
                  {event.description.length <= descriptionLength || descriptionExpanded ? (
                    <p className="whitespace-pre-wrap">{event.description}</p>
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {event.description.slice(0, descriptionLength)}…
                    </p>
                  )}
                  {event.description.length > descriptionLength && !descriptionExpanded && (
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded(true)}
                      className="mt-2 text-sm font-medium text-primary hover:underline"
                    >
                      Read more
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Good to know */}
            <section className="mt-8 rounded-xl border border-border bg-muted/20 p-6" aria-labelledby="good-to-know-heading">
              <h2 id="good-to-know-heading" className="font-heading text-lg font-semibold text-foreground">
                Good to know
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-foreground/70" aria-hidden />
                  {formatDuration(event.startDate, event.endDate)}
                </li>
                {getAgeHighlight(ticketTypes) && (
                  <li className="flex items-center gap-2">
                    <span className="font-medium text-foreground">Ages:</span>
                    {getAgeHighlight(ticketTypes)}
                  </li>
                )}
                <li>In person</li>
                <li>
                  <span className="font-medium text-foreground">Refund policy:</span> No refunds
                </li>
              </ul>
            </section>

            {/* Location */}
            {(event.location || event.city) && (
              <section className="mt-8" aria-labelledby="location-heading">
                <h2 id="location-heading" className="font-heading text-lg font-semibold text-foreground">
                  Location
                </h2>
                <div className="mt-3 rounded-xl border border-border bg-card p-5">
                  <p className="font-medium text-foreground">
                    {event.location || event.city}
                  </p>
                  {event.location && event.city && (
                    <p className="mt-1 text-sm text-muted-foreground">{event.city}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [event.location, event.city].filter(Boolean).join(', ')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <MapPin className="h-4 w-4" aria-hidden />
                    Show map
                  </a>
                </div>
              </section>
            )}

            {/* Organized by */}
            {event.organizerName && (
              <section className="mt-8 rounded-xl border border-border bg-card p-5" aria-labelledby="organizer-heading">
                <h2 id="organizer-heading" className="font-heading text-lg font-semibold text-foreground">
                  Organized by
                </h2>
                <p className="mt-2 font-medium text-foreground">{event.organizerName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contact the organizer for questions or refunds.
                </p>
              </section>
            )}

            {/* ticket types */}
            <section className="mt-8 rounded-xl border-2 border-primary/20 bg-card p-6 shadow-sm" aria-labelledby="tickets-heading">
              <h2 id="tickets-heading" className="font-heading text-lg font-semibold text-foreground">
                Ticket types: <span className="font-normal text-muted-foreground">Define types of tickets available for this event, such as General Admission, VIP, Early Bird, etc. Each ticket type can have its own price, quantity, and optional age restrictions.</span>
              </h2>
              {ticketTypes.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No tickets available yet. Check back later.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {ticketTypes.map((tt) => (
                    <li
                      key={tt.id}
                      className="flex flex-col gap-1 rounded-lg border border-border bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <span className="font-medium text-foreground">{tt.name}</span>
                        {(tt.ageMin != null || tt.ageMax != null) && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            (Age {tt.ageMin ?? '?'}–{tt.ageMax ?? '?'})
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-foreground">
                        {tt.price === 0 ? 'Free' : `$${tt.price.toFixed(2)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {discounts.length > 0 && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-sm font-medium text-foreground">Offers</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {discounts.map((d) => (
                      <li key={d.id}>
                        {d.name}: {d.discountPercent}% off
                        {d.type === 'early_bird' && d.validTo && ` until ${new Date(d.validTo).toLocaleDateString()}`}
                        {d.type === 'group' && d.minQuantity != null && ` (${d.minQuantity}+ tickets)`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                Checkout will be available in a future update.
              </p>
            </section>

            {/* Related */}
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="font-heading text-base font-semibold text-foreground">
                Related
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                <Link href="/events" className="font-medium text-primary hover:underline">
                  Browse all events
                </Link>
                {event.country && (
                  <>
                    {' · '}
                    <Link
                      href={`/events?country=${encodeURIComponent(event.country)}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Events in {event.country}
                    </Link>
                  </>
                )}
              </p>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
