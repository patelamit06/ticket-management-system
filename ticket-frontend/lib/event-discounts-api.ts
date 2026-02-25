import { apiWithAuth } from './auth';

export interface EventDiscountPayload {
  id: string;
  eventId: string;
  name: string;
  type: string;
  discountPercent: number;
  validTo: string | null;
  minQuantity: number | null;
  ticketTypeIds: string[] | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventDiscountBody {
  name: string;
  type: 'early_bird' | 'group';
  discountPercent: number;
  validTo?: string;
  minQuantity?: number;
  ticketTypeIds?: string[];
  sortOrder?: number;
}

export interface UpdateEventDiscountBody {
  name?: string;
  type?: 'early_bird' | 'group';
  discountPercent?: number;
  validTo?: string;
  minQuantity?: number;
  ticketTypeIds?: string[];
  sortOrder?: number;
}

export async function createEventDiscount(
  eventId: string,
  body: CreateEventDiscountBody
): Promise<EventDiscountPayload> {
  return apiWithAuth(`/events/${eventId}/discounts`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getEventDiscounts(eventId: string): Promise<EventDiscountPayload[]> {
  return apiWithAuth(`/events/${eventId}/discounts`);
}

export async function getPublicEventDiscounts(eventId: string): Promise<EventDiscountPayload[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/events/${eventId}/discounts/public`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error('Failed to fetch discounts');
  return res.json() as Promise<EventDiscountPayload[]>;
}

export async function updateEventDiscount(
  eventId: string,
  discountId: string,
  body: UpdateEventDiscountBody
): Promise<EventDiscountPayload> {
  return apiWithAuth(`/events/${eventId}/discounts/${discountId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteEventDiscount(
  eventId: string,
  discountId: string
): Promise<void> {
  await apiWithAuth(`/events/${eventId}/discounts/${discountId}`, {
    method: 'DELETE',
  });
}
