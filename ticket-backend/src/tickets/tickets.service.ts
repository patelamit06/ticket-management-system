import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface TicketPayload {
  id: string;
  uniqueCode: string;
  usedAt: string | null;
  ticketTypeName: string;
  orderItemId: string;
}

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Generate a URL-safe unique code for a ticket. */
  private generateUniqueCode(): string {
    return randomBytes(12).toString('base64url');
  }

  /**
   * Return all tickets for an order, enforcing ownership.
   * Authenticated users must own the order; guests supply the order's email.
   */
  async getForOrder(
    orderId: string,
    userId?: string,
    guestEmail?: string,
  ): Promise<TicketPayload[]> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            tickets: true,
            ticketType: true,
          },
        },
      },
    });

    if (!order) return [];

    if (userId) {
      if (order.userId !== userId) return [];
    } else if (guestEmail) {
      if (order.guestEmail?.toLowerCase() !== guestEmail.trim().toLowerCase()) return [];
    } else {
      return [];
    }

    const tickets: TicketPayload[] = [];
    for (const item of order.items) {
      for (const ticket of item.tickets) {
        tickets.push({
          id: ticket.id,
          uniqueCode: ticket.uniqueCode,
          usedAt: ticket.usedAt?.toISOString() ?? null,
          ticketTypeName: item.ticketType.name,
          orderItemId: ticket.orderItemId,
        });
      }
    }
    return tickets;
  }

  /**
   * Create ticket records for each order item (quantity per item).
   * Call this after order is marked paid.
   */
  async createForOrder(orderId: string): Promise<number> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return 0;

    let created = 0;
    for (const item of order.items) {
      const codes = new Set<string>();
      while (codes.size < item.quantity) {
        codes.add(this.generateUniqueCode());
      }
      await this.prisma.ticket.createMany({
        data: Array.from(codes).map((uniqueCode) => ({
          orderItemId: item.id,
          uniqueCode,
        })),
      });
      created += item.quantity;
    }
    return created;
  }
}
