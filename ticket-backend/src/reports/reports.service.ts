import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  purchasedAt: Date;
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

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEventSalesReport(
    userId: string,
    isSuperAdmin: boolean,
  ): Promise<SalesReportResponse> {
    const events = await this.prisma.event.findMany({
      where: {
        status: 'published',
        ...(isSuperAdmin ? {} : { organizerId: userId }),
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const eventIds = events.map((event) => event.id);
    const paidOrders = eventIds.length
      ? await this.prisma.order.findMany({
          where: {
            status: 'paid',
            eventId: { in: eventIds },
          },
          select: {
            eventId: true,
            totalAmount: true,
            currency: true,
            items: { select: { quantity: true } },
          },
        })
      : [];

    const salesByEvent = new Map<
      string,
      { ticketsSold: number; totalAmount: number; currency: string | null }
    >();

    for (const order of paidOrders) {
      const prev = salesByEvent.get(order.eventId) ?? {
        ticketsSold: 0,
        totalAmount: 0,
        currency: order.currency ?? null,
      };
      const orderTickets = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const orderAmount = Number(order.totalAmount ?? 0);

      salesByEvent.set(order.eventId, {
        ticketsSold: prev.ticketsSold + orderTickets,
        totalAmount: prev.totalAmount + orderAmount,
        currency:
          prev.currency && order.currency && prev.currency !== order.currency
            ? 'MIXED'
            : prev.currency ?? order.currency ?? null,
      });
    }

    const eventSummaries: EventSalesSummary[] = events.map((event) => {
      const sales = salesByEvent.get(event.id) ?? {
        ticketsSold: 0,
        totalAmount: 0,
        currency: null,
      };
      return {
        eventId: event.id,
        eventName: event.name,
        eventStatus: event.status,
        ticketsSold: sales.ticketsSold,
        totalAmount: Number(sales.totalAmount ?? 0),
        currency: sales.currency,
      };
    });

    const totals = eventSummaries.reduce(
      (acc, event) => {
        acc.events += 1;
        acc.ticketsSold += event.ticketsSold;
        acc.totalAmount += event.totalAmount;
        if (acc.currency && event.currency && acc.currency !== event.currency) {
          acc.currency = 'MIXED';
        } else if (!acc.currency) {
          acc.currency = event.currency;
        }
        return acc;
      },
      { events: 0, ticketsSold: 0, totalAmount: 0, currency: null as string | null }
    );

    return {
      totals: {
        events: totals.events,
        ticketsSold: totals.ticketsSold,
        totalAmount: totals.totalAmount,
        currency: totals.currency,
      },
      events: eventSummaries,
    };
  }

  async getEventSalesDetails(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
  ): Promise<EventSalesDetailsResponse> {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        status: 'published',
        ...(isSuperAdmin ? {} : { organizerId: userId }),
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Published event not found');
    }

    const paidOrders = await this.prisma.order.findMany({
      where: {
        eventId,
        status: 'paid',
      },
      select: {
        id: true,
        totalAmount: true,
        currency: true,
        guestEmail: true,
        guestName: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const customers: EventSalesDetailItem[] = paidOrders.map((order) => ({
      orderId: order.id,
      buyerName: order.user?.name ?? order.guestName ?? 'Guest buyer',
      buyerEmail: order.user?.email ?? order.guestEmail ?? '—',
      buyerPhone: order.user?.phone ?? null,
      ticketsSold: order.items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: Number(order.totalAmount ?? 0),
      currency: order.currency ?? null,
      purchasedAt: order.createdAt,
    }));

    const totals = customers.reduce(
      (acc, order) => {
        acc.orders += 1;
        acc.ticketsSold += order.ticketsSold;
        acc.totalAmount += order.totalAmount;
        if (acc.currency && order.currency && acc.currency !== order.currency) {
          acc.currency = 'MIXED';
        } else if (!acc.currency) {
          acc.currency = order.currency;
        }
        return acc;
      },
      { orders: 0, ticketsSold: 0, totalAmount: 0, currency: null as string | null },
    );

    return {
      event,
      totals,
      customers,
    };
  }
}
