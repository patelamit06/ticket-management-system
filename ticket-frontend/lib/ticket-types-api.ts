import { apiWithAuth } from './auth';

export interface TicketTypePayload {
  id: string;
  eventId: string;
  name: string;
  price: number;
  quantity: number;
  maxPerOrder: number;
  availabilityStart: string | null;
  availabilityEnd: string | null;
  ageMin: number | null;
  ageMax: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketTypeBody {
  name: string;
  price: number;
  quantity?: number;
  maxPerOrder?: number;
  availabilityStart?: string;
  availabilityEnd?: string;
  ageMin?: number;
  ageMax?: number;
  sortOrder?: number;
}

export interface UpdateTicketTypeBody {
  name?: string;
  price?: number;
  quantity?: number;
  maxPerOrder?: number;
  availabilityStart?: string;
  availabilityEnd?: string;
  ageMin?: number;
  ageMax?: number;
  sortOrder?: number;
}

export async function createTicketType(
  eventId: string,
  body: CreateTicketTypeBody
): Promise<TicketTypePayload> {
  return apiWithAuth(`/events/${eventId}/ticket-types`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getTicketTypes(eventId: string): Promise<TicketTypePayload[]> {
  return apiWithAuth(`/events/${eventId}/ticket-types`);
}

export async function getPublicTicketTypes(
  eventId: string
): Promise<TicketTypePayload[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/events/${eventId}/ticket-types/public`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to fetch ticket types');
  return res.json() as Promise<TicketTypePayload[]>;
}

export async function updateTicketType(
  eventId: string,
  ticketTypeId: string,
  body: UpdateTicketTypeBody
): Promise<TicketTypePayload> {
  return apiWithAuth(`/events/${eventId}/ticket-types/${ticketTypeId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteTicketType(
  eventId: string,
  ticketTypeId: string
): Promise<void> {
  await apiWithAuth(`/events/${eventId}/ticket-types/${ticketTypeId}`, {
    method: 'DELETE',
  });
}
