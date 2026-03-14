import { apiWithAuth } from './auth';

export interface EventSalesSummary {
  eventId: string;
  eventName: string;
  eventStatus: string;
  ticketsSold: number;
  totalAmount: number;
  currency: string | null;
}

export interface SalesReportResponse {
  totals: {
    events: number;
    ticketsSold: number;
    totalAmount: number;
    currency: string | null;
  };
  events: EventSalesSummary[];
}

export interface EventSalesDetailItem {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  ticketsSold: number;
  totalAmount: number;
  currency: string | null;
  purchasedAt: string;
}

export interface EventSalesDetailsResponse {
  event: {
    id: string;
    name: string;
    status: string;
  };
  totals: {
    orders: number;
    ticketsSold: number;
    totalAmount: number;
    currency: string | null;
  };
  customers: EventSalesDetailItem[];
}

export async function getSalesReport(): Promise<SalesReportResponse> {
  return apiWithAuth('/reports/sales/events');
}

export async function getEventSalesDetails(eventId: string): Promise<EventSalesDetailsResponse> {
  return apiWithAuth(`/reports/sales/events/${eventId}`);
}
