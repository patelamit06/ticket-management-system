import { apiWithAuth } from './auth';

export interface EventMediaItem {
  id: string;
  eventId: string;
  type: string;
  url: string;
  caption: string | null;
  sortOrder: number;
}

export interface EventPayload {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  bannerUrl: string | null;
  status: string;
  organizerId: string;
  organizerName?: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  groupDiscountTiers: unknown;
  createdAt: string;
  updatedAt: string;
  /** Public list/detail: images and video URLs */
  media?: EventMediaItem[];
}

export interface CreateEventBody {
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  bannerUrl?: string;
  country?: string;
  city?: string;
  timezone?: string;
}

export interface UpdateEventBody {
  name?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bannerUrl?: string;
  status?: string;
  country?: string;
  city?: string;
  timezone?: string;
}

export async function createEvent(body: CreateEventBody): Promise<EventPayload> {
  return apiWithAuth('/events', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getMyEvents(): Promise<EventPayload[]> {
  return apiWithAuth('/events/my');
}

export async function getEvent(eventId: string): Promise<EventPayload> {
  return apiWithAuth(`/events/${eventId}`);
}

export async function updateEvent(
  eventId: string,
  body: UpdateEventBody
): Promise<EventPayload> {
  return apiWithAuth(`/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteEvent(eventId: string): Promise<void> {
  await apiWithAuth(`/events/${eventId}`, { method: 'DELETE' });
}

export interface PublicEventsResponse {
  events: EventPayload[];
  total: number;
}

export async function getPublicEvents(params?: {
  country?: string;
  city?: string;
  limit?: number;
  offset?: number;
}): Promise<PublicEventsResponse> {
  const search = new URLSearchParams();
  if (params?.country) search.set('country', params.country);
  if (params?.city) search.set('city', params.city);
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  const url = qs ? `/events/public?${qs}` : '/events/public';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${apiUrl}${url}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json() as Promise<PublicEventsResponse>;
}

export async function getPublicEvent(eventId: string): Promise<EventPayload | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/events/public/${eventId}`, {
    credentials: 'include',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch event');
  return res.json() as Promise<EventPayload>;
}
