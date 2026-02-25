'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  /** Slide content (images or custom markup). Replace with your own when you have assets. */
  slides: React.ReactNode[];
  /** Auto-advance interval in ms. Set 0 to disable. */
  autoPlayMs?: number;
  /** Accessibility label for the carousel. */
  'aria-label'?: string;
}

export function HeroCarousel({
  slides,
  autoPlayMs = 5000,
  'aria-label': ariaLabel = 'Hero carousel',
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const length = slides.length;

  const goTo = useCallback(
    (next: number) => {
      setIndex((i) => (length ? ((i + next) % length + length) % length : 0));
    },
    [length]
  );

  const goNext = useCallback(() => goTo(1), [goTo]);
  const goPrev = useCallback(() => goTo(-1), [goTo]);

  useEffect(() => {
    if (autoPlayMs <= 0 || length <= 1) return;
    const id = setInterval(goNext, autoPlayMs);
    return () => clearInterval(id);
  }, [autoPlayMs, length, goNext]);

  if (!length) return null;

  return (
    <div
      className="relative w-full"
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
    >
      <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="min-w-full flex-shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${length}`}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring sm:left-4"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-ring sm:right-4"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-background/70 hover:bg-background/90'
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? true : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
