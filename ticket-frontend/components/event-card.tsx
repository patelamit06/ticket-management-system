'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventPayload } from '@/lib/events-api';

function toEmbedVideoUrl(url: string): string {
  const trimmed = url.trim();
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return trimmed;
}

type EventCardVariant = 'public' | 'dashboard';

export function EventCard({
  ev,
  href,
  variant = 'public',
}: {
  ev: EventPayload;
  href: string;
  variant?: EventCardVariant;
}) {
  const slides = React.useMemo(() => {
    if (ev.bannerUrl) {
      return [{ type: 'image' as const, url: ev.bannerUrl }, ...(ev.media ?? [])];
    }
    return ev.media ?? [];
  }, [ev.bannerUrl, ev.media]);
  const [index, setIndex] = React.useState(0);
  const hasCarousel = slides.length > 1;
  const current = slides[index];

  const go = (delta: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + slides.length) % slides.length);
  };

  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative h-40 w-full shrink-0 bg-muted" role={hasCarousel ? 'group' : undefined}>
        {!current ? (
          <div className="flex h-full w-full items-center justify-center rounded-none bg-gradient-to-br from-primary/20 to-primary/5">
            <CalendarDays className="h-14 w-14 text-primary/50" aria-hidden />
          </div>
        ) : current.type === 'image' ? (
          <img src={current.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <iframe
            src={toEmbedVideoUrl(current.url)}
            title="Video"
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="eager"
          />
        )}
        {hasCarousel && (
          <>
            <button
              type="button"
              onClick={go(-1)}
              className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={go(1)}
              className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-1.5 left-0 right-0 z-10 flex justify-center gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'}`}
                  aria-label={`Slide ${i + 1} of ${slides.length}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-5">
        <h2 className="font-heading font-semibold text-foreground line-clamp-2">{ev.name}</h2>
        {variant === 'public' && ev.organizerName && (
          <p className="mt-1 text-sm text-muted-foreground">By {ev.organizerName}</p>
        )}
        {variant === 'dashboard' && (
          <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {ev.status}
          </span>
        )}
        {ev.location && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
            {ev.location}
            {ev.city ? `, ${ev.city}` : ''}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {new Date(ev.startDate).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>
    </Link>
  );
}
