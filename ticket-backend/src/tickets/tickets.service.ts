import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Generate a URL-safe unique code for a ticket. */
  private generateUniqueCode(): string {
    return randomBytes(12).toString('base64url');
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
