const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
import { getToken } from './auth';

export interface OrderItemPayload {
  id: string;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface OrderPayload {
  id: string;
  userId: string | null;
  eventId: string;
  eventName: string;
  status: string;
  totalAmount: number;
  currency: string;
  stripePaymentIntentId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  taxAmount: number | null;
  taxCountry: string | null;
  applicationFeeAmount: number | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemPayload[];
}

export interface CreateOrderBody {
  eventId: string;
  items: { ticketTypeId: string; quantity: number }[];
  guestEmail?: string;
  guestName?: string;
}

async function fetchApi<T>(
  path: string,
  options: RequestInit & { method?: string; body?: string } = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const token = typeof window !== 'undefined' ? getToken() : null;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

/** Call API without sending Authorization (for guest payment – avoids 401 from stale token). */
async function fetchApiPublic<T>(
  path: string,
  options: RequestInit & { method?: string; body?: string } = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function createOrder(body: CreateOrderBody): Promise<OrderPayload> {
  return fetchApi<OrderPayload>('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getOrder(orderId: string, guestEmail?: string): Promise<OrderPayload | null> {
  const params = guestEmail ? new URLSearchParams({ email: guestEmail }) : '';
  const path = `/orders/${orderId}${params ? `?${params}` : ''}`;
  try {
    return await fetchApi<OrderPayload>(path);
  } catch {
    return null;
  }
}

export async function getMyOrders(): Promise<OrderPayload[]> {
  return fetchApi<OrderPayload[]>('/orders/my');
}

/** Public endpoint – never sends Authorization so guests never get 401. */
export async function createPaymentIntent(orderId: string): Promise<{ clientSecret: string }> {
  return fetchApiPublic<{ clientSecret: string }>(`/payments/orders/${orderId}/create-payment-intent`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/** Public endpoint – never sends Authorization so guests never get 401. */
export async function createCheckoutSession(
  orderId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string }> {
  return fetchApiPublic<{ url: string }>(`/payments/orders/${orderId}/checkout-session`, {
    method: 'POST',
    body: JSON.stringify({ successUrl, cancelUrl }),
  });
}
