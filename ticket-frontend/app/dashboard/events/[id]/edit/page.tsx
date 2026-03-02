'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { inputClass, selectClass } from '@/lib/input-styles';
import {
  getEvent,
  updateEvent,
  type EventPayload,
  type UpdateEventBody,
} from '@/lib/events-api';
import {
  getTicketTypes,
  createTicketType,
  deleteTicketType,
  type TicketTypePayload,
  type CreateTicketTypeBody,
} from '@/lib/ticket-types-api';
import {
  getEventDiscounts,
  createEventDiscount,
  deleteEventDiscount,
  type EventDiscountPayload,
  type CreateEventDiscountBody,
} from '@/lib/event-discounts-api';
import {
  getEventMedia,
  uploadEventMedia,
  addEventMediaVideo,
  deleteEventMedia,
  type EventMediaPayload,
} from '@/lib/event-media-api';

const eventSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  country: z.string().optional(),
  city: z.string().max(200).optional(),
  timezone: z.string().max(100).optional(),
});

const ticketSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().min(0).optional(),
  maxPerOrder: z.number().min(1).max(20).optional(),
  ageMin: z.number().min(0).max(120).optional(),
  ageMax: z.number().min(0).max(120).optional(),
});

const discountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['early_bird', 'group']),
  discountPercent: z.number().min(0).max(100),
  validTo: z.string().optional(),
  minQuantity: z.number().min(1).optional(),
});

type EventForm = z.infer<typeof eventSchema>;
type TicketForm = z.infer<typeof ticketSchema>;
type DiscountForm = z.infer<typeof discountSchema>;

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = typeof params.id === 'string' ? params.id : null;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { countries } = useLocale();
  const [event, setEvent] = React.useState<EventPayload | null>(null);
  const [ticketTypes, setTicketTypes] = React.useState<TicketTypePayload[]>([]);
  const [discounts, setDiscounts] = React.useState<EventDiscountPayload[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [addingTicket, setAddingTicket] = React.useState(false);
  const [addingDiscount, setAddingDiscount] = React.useState(false);
  const [media, setMedia] = React.useState<EventMediaPayload[]>([]);
  const [addingVideo, setAddingVideo] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState('');
  const [uploadingMedia, setUploadingMedia] = React.useState(false);
  const [imgLoadErrors, setImgLoadErrors] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);

  const eventForm = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      country: '',
      city: '',
      timezone: '',
    },
  });

  const ticketForm = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      name: '',
      price: 0,
      quantity: 0,
      maxPerOrder: 10,
      ageMin: undefined,
      ageMax: undefined,
    },
  });

  const discountForm = useForm<DiscountForm>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: '',
      type: 'early_bird',
      discountPercent: 0,
      validTo: '',
      minQuantity: undefined,
    },
  });

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  function toDateTimeLocal(iso: string): string {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  }

  React.useEffect(() => {
    if (!eventId || !isAuthenticated) return;
    getEvent(eventId)
      .then((ev) => {
        setEvent(ev);
        eventForm.reset({
          name: ev.name,
          description: ev.description ?? '',
          location: ev.location ?? '',
          startDate: toDateTimeLocal(ev.startDate),
          endDate: toDateTimeLocal(ev.endDate),
          country: ev.country ?? '',
          city: ev.city ?? '',
          timezone: ev.timezone ?? '',
        });
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [eventId, isAuthenticated]);

  React.useEffect(() => {
    if (!eventId) return;
    getTicketTypes(eventId).then(setTicketTypes).catch(() => setTicketTypes([]));
    getEventDiscounts(eventId).then(setDiscounts).catch(() => setDiscounts([]));
    getEventMedia(eventId).then(setMedia).catch(() => setMedia([]));
  }, [eventId]);

  const onEventSubmit = eventForm.handleSubmit(async (data) => {
    if (!eventId) return;
    setError(null);
    setSaving(true);
    try {
      const body: UpdateEventBody = {
        name: data.name,
        description: data.description || undefined,
        location: data.location || undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        country: data.country || undefined,
        city: data.city || undefined,
        timezone: data.timezone || undefined,
      };
      const updated = await updateEvent(eventId, body);
      setEvent(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  });

  const onAddTicket = ticketForm.handleSubmit(async (data) => {
    if (!eventId) return;
    setError(null);
    setSaving(true);
    try {
      const body: CreateTicketTypeBody = {
        name: data.name,
        price: data.price,
        quantity: data.quantity ?? 0,
        maxPerOrder: data.maxPerOrder ?? 10,
        ageMin: data.ageMin,
        ageMax: data.ageMax,
      };
      const created = await createTicketType(eventId, body);
      setTicketTypes((prev) => [...prev, created]);
      ticketForm.reset({ name: '', price: 0, quantity: 0, maxPerOrder: 10, ageMin: undefined, ageMax: undefined });
      setAddingTicket(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add ticket type');
    } finally {
      setSaving(false);
    }
  });

  const onRemoveTicket = async (ticketTypeId: string) => {
    if (!eventId) return;
    setError(null);
    try {
      await deleteTicketType(eventId, ticketTypeId);
      setTicketTypes((prev) => prev.filter((t) => t.id !== ticketTypeId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    }
  };

  const onAddDiscount = discountForm.handleSubmit(async (data) => {
    if (!eventId) return;
    setError(null);
    setSaving(true);
    try {
      const body: CreateEventDiscountBody = {
        name: data.name,
        type: data.type as 'early_bird' | 'group',
        discountPercent: data.discountPercent,
        validTo: data.validTo || undefined,
        minQuantity: data.minQuantity,
      };
      const created = await createEventDiscount(eventId, body);
      setDiscounts((prev) => [...prev, created]);
      discountForm.reset({ name: '', type: 'early_bird', discountPercent: 0, validTo: '', minQuantity: undefined });
      setAddingDiscount(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add discount');
    } finally {
      setSaving(false);
    }
  });

  const onRemoveDiscount = async (discountId: string) => {
    if (!eventId) return;
    setError(null);
    try {
      await deleteEventDiscount(eventId, discountId);
      setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!eventId || !e.target.files?.[0]) return;
    setError(null);
    setUploadingMedia(true);
    try {
      const created = await uploadEventMedia(eventId, e.target.files[0]);
      setMedia((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleAddVideo = async () => {
    if (!eventId || !videoUrl.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const created = await addEventMediaVideo(eventId, { type: 'video', url: videoUrl.trim() });
      setMedia((prev) => [...prev, created]);
      setVideoUrl('');
      setAddingVideo(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add video');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMedia = async (mediaId: string) => {
    if (!eventId) return;
    setError(null);
    try {
      await deleteEventMedia(eventId, mediaId);
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  if (!eventId || (!loading && !event)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          <p className="text-muted-foreground">Event not found.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-primary hover:underline">
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Dashboard
          </Link>
          <Link href={`/dashboard/events/${eventId}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            View event
          </Link>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Edit event</h1>
        {error && (
          <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : (
          <>
            <form onSubmit={onEventSubmit} className="mt-6 space-y-6">
              <section className="space-y-4 rounded-xl border border-border bg-card p-6">
                <h2 className="font-heading text-lg font-semibold text-foreground">Event details</h2>
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">Event name *</label>
                  <input id="name" className={inputClass} {...eventForm.register('name')} />
                  {eventForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-destructive">{eventForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="description" className="mb-1 block text-sm font-medium text-foreground">Description</label>
                  <textarea id="description" rows={3} className={inputClass} {...eventForm.register('description')} />
                </div>
                <div>
                  <label htmlFor="location" className="mb-1 block text-sm font-medium text-foreground">Location</label>
                  <input id="location" className={inputClass} {...eventForm.register('location')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-foreground">Start *</label>
                    <input id="startDate" type="datetime-local" className={inputClass} {...eventForm.register('startDate')} />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-foreground">End *</label>
                    <input id="endDate" type="datetime-local" className={inputClass} {...eventForm.register('endDate')} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="country" className="mb-1 block text-sm font-medium text-foreground">Country</label>
                    <select id="country" className={selectClass} {...eventForm.register('country')}>
                      <option value="">Select</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="city" className="mb-1 block text-sm font-medium text-foreground">City</label>
                    <input id="city" className={inputClass} {...eventForm.register('city')} />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save event details'}
                </button>
              </section>
            </form>

            <section className="mt-8 rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">Ticket types</h2>
              <ul className="mt-4 space-y-3">
                {ticketTypes.map((tt) => (
                  <li key={tt.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <span className="font-medium text-foreground">{tt.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {tt.price === 0 ? 'Free' : `$${tt.price.toFixed(2)}`}
                    </span>
                    <button type="button" onClick={() => onRemoveTicket(tt.id)} className="text-sm text-destructive hover:underline">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              {!addingTicket ? (
                <button type="button" onClick={() => setAddingTicket(true)} className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50">
                  + Add ticket type
                </button>
              ) : (
                <form onSubmit={onAddTicket} className="mt-4 space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Name *</label>
                      <input className={inputClass} {...ticketForm.register('name')} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Price *</label>
                      <input type="number" step="0.01" min={0} className={inputClass} {...ticketForm.register('price', { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Max per order</label>
                      <input type="number" min={1} max={20} className={inputClass} {...ticketForm.register('maxPerOrder', { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Age min / max</label>
                      <div className="flex gap-2">
                        <input type="number" min={0} max={120} placeholder="Min" className={inputClass} {...ticketForm.register('ageMin', { valueAsNumber: true })} />
                        <input type="number" min={0} max={120} placeholder="Max" className={inputClass} {...ticketForm.register('ageMax', { valueAsNumber: true })} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Add</button>
                    <button type="button" onClick={() => { setAddingTicket(false); ticketForm.reset(); }} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/50">Cancel</button>
                  </div>
                </form>
              )}
            </section>

            <section className="mt-8 rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">Discounts</h2>
              <p className="mt-1 text-sm text-muted-foreground">Discount types (e.g. Early bird, Group) applied at checkout.</p>
              <ul className="mt-4 space-y-3">
                {discounts.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <span className="font-medium text-foreground">{d.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {d.discountPercent}% off
                      {d.type === 'early_bird' && d.validTo && ` until ${new Date(d.validTo).toLocaleDateString()}`}
                      {d.type === 'group' && d.minQuantity != null && ` · ${d.minQuantity}+ tickets`}
                    </span>
                    <button type="button" onClick={() => onRemoveDiscount(d.id)} className="text-sm text-destructive hover:underline">Remove</button>
                  </li>
                ))}
              </ul>
              {!addingDiscount ? (
                <button type="button" onClick={() => setAddingDiscount(true)} className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50">
                  + Add discount
                </button>
              ) : (
                <form onSubmit={onAddDiscount} className="mt-4 space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Name *</label>
                      <input className={inputClass} {...discountForm.register('name')} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Type</label>
                      <select className={selectClass} {...discountForm.register('type')}>
                        <option value="early_bird">Early bird</option>
                        <option value="group">Group</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Discount % *</label>
                    <input type="number" min={0} max={100} className={inputClass} {...discountForm.register('discountPercent', { valueAsNumber: true })} />
                  </div>
                  {discountForm.watch('type') === 'early_bird' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Valid until</label>
                      <input type="date" className={inputClass} {...discountForm.register('validTo')} />
                    </div>
                  )}
                  {discountForm.watch('type') === 'group' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Min quantity</label>
                      <input type="number" min={1} className={inputClass} {...discountForm.register('minQuantity', { valueAsNumber: true })} />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Add</button>
                    <button type="button" onClick={() => { setAddingDiscount(false); discountForm.reset(); }} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/50">Cancel</button>
                  </div>
                </form>
              )}
            </section>

            <section className="mt-8 rounded-xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold text-foreground">Photos & videos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Images and video links shown in a carousel on the event page.
              </p>
              {media.some((m) => m.type === 'image') && media.some((m) => m.type === 'image' && imgLoadErrors.has(m.id)) && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                  Some thumbnails could not load. If images are missing, set the MinIO bucket &quot;events&quot; to public read (Console → http://localhost:9001).
                </p>
              )}
              <ul className="mt-4 space-y-3">
                {media.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    {m.type === 'image' ? (
                      imgLoadErrors.has(m.id) ? (
                        <span className="flex h-12 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">Image</span>
                      ) : (
                        <img
                          src={m.url}
                          alt={m.caption ?? ''}
                          className="h-12 w-16 rounded object-cover bg-muted"
                          referrerPolicy="no-referrer"
                          onError={() => setImgLoadErrors((prev) => new Set(prev).add(m.id))}
                        />
                      )
                    ) : (
                      <span className="flex h-12 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">Video</span>
                    )}
                    <span className="flex-1 truncate text-sm text-muted-foreground">
                      {m.type === 'image' ? 'Image' : 'Video'}
                      {m.caption ? ` · ${m.caption}` : ''}
                    </span>
                    <button type="button" onClick={() => handleRemoveMedia(m.id)} className="text-sm text-destructive hover:underline">Remove</button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="cursor-pointer rounded-lg border border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" onChange={handleUploadImage} disabled={uploadingMedia} />
                  {uploadingMedia ? 'Uploading…' : '+ Upload image'}
                </label>
                {!addingVideo ? (
                  <button type="button" onClick={() => setAddingVideo(true)} className="rounded-lg border border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50">
                    + Add video link
                  </button>
                ) : (
                  <div className="flex flex-1 flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
                    <input
                      type="url"
                      placeholder="YouTube or video URL"
                      className={inputClass}
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVideo())}
                    />
                    <button type="button" onClick={handleAddVideo} disabled={saving || !videoUrl.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                      {saving ? 'Adding…' : 'Add'}
                    </button>
                    <button type="button" onClick={() => { setAddingVideo(false); setVideoUrl(''); }} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/50">Cancel</button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
