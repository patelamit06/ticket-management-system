import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

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
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemPayload[];
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute number of tickets already sold for a ticket type (from paid orders only).
   */
  private async getSoldQuantity(ticketTypeId: string): Promise<number> {
    const agg = await this.prisma.orderItem.aggregate({
      where: {
        ticketTypeId,
        order: { status: 'paid' },
      },
      _sum: { quantity: true },
    });
    return agg._sum.quantity ?? 0;
  }

  /**
   * Create order (guest or authenticated). Validates event is published, ticket types exist and have capacity.
   */
  async create(
    dto: CreateOrderDto,
    userId: string | undefined,
  ): Promise<OrderPayload> {
    if (!userId && (!dto.guestEmail?.trim() || !dto.guestName?.trim())) {
      throw new BadRequestException('Guest email and name are required when not logged in');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { ticketTypes: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.status !== 'published') {
      throw new BadRequestException('Event is not available for purchase');
    }

    if (!dto.items?.length) {
      throw new BadRequestException('At least one item is required');
    }

    const ticketTypeMap = new Map(
      event.ticketTypes.filter((tt) => tt.isActive).map((tt) => [tt.id, tt]),
    );
    let totalCents = 0;
    const orderItemsData: { ticketTypeId: string; quantity: number; priceAtPurchase: number }[] = [];

    for (const item of dto.items) {
      const tt = ticketTypeMap.get(item.ticketTypeId);
      if (!tt) {
        throw new BadRequestException(`Ticket type ${item.ticketTypeId} not found or not for this event`);
      }
      if (item.quantity > tt.maxPerOrder) {
        throw new BadRequestException(
          `Quantity for ${tt.name} cannot exceed ${tt.maxPerOrder} per order`,
        );
      }
      const sold = await this.getSoldQuantity(tt.id);
      const available = tt.quantity === 0 ? Number.MAX_SAFE_INTEGER : Math.max(0, tt.quantity - sold);
      if (item.quantity > available) {
        throw new BadRequestException(
          `Not enough capacity for ${tt.name}. Available: ${available}`,
        );
      }
      const price = Number(tt.price);
      const lineTotal = price * item.quantity;
      totalCents += Math.round(lineTotal * 100);
      orderItemsData.push({
        ticketTypeId: tt.id,
        quantity: item.quantity,
        priceAtPurchase: price,
      });
    }

    const totalAmount = totalCents / 100;
    const currency = 'USD';

    const order = await this.prisma.order.create({
      data: {
        userId: userId ?? null,
        eventId: event.id,
        status: 'pending',
        totalAmount,
        currency,
        guestEmail: dto.guestEmail?.trim() ?? null,
        guestName: dto.guestName?.trim() ?? null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        event: true,
        items: {
          include: { ticketType: true },
        },
      },
    });

    return this.toPayload(order);
  }

  async findOne(orderId: string, userId: string | undefined, guestEmail?: string): Promise<OrderPayload | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        items: { include: { ticketType: true } },
      },
    });
    if (!order) return null;

    if (order.userId) {
      if (userId !== order.userId) {
        throw new ForbiddenException('You do not have access to this order');
      }
    } else {
      if (!order.guestEmail || order.guestEmail.toLowerCase() !== guestEmail?.trim().toLowerCase()) {
        throw new ForbiddenException('You do not have access to this order');
      }
    }

    return this.toPayload(order);
  }

  /** List orders for the authenticated user. */
  async findMy(userId: string): Promise<OrderPayload[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        event: true,
        items: { include: { ticketType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toPayload(o));
  }

  async findByPaymentIntentId(stripePaymentIntentId: string): Promise<{ id: string } | null> {
    const order = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId },
      select: { id: true },
    });
    return order;
  }

  async findByIdForPayment(orderId: string): Promise<{
    id: string;
    eventId: string;
    eventName: string;
    totalAmount: number;
    currency: string;
    status: string;
    stripePaymentIntentId: string | null;
    organizerStripeConnectAccountId: string | null;
  } | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: { include: { organizer: true } },
      },
    });
    if (!order) return null;
    return {
      id: order.id,
      eventId: order.eventId,
      eventName: order.event.name,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      status: order.status,
      stripePaymentIntentId: order.stripePaymentIntentId,
      organizerStripeConnectAccountId: order.event.organizer.stripeConnectAccountId,
    };
  }

  async setPaymentIntentId(orderId: string, stripePaymentIntentId: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId },
    });
  }

  async markPaid(orderId: string, stripePaymentIntentId: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        stripePaymentIntentId,
      },
    });
  }

  private toPayload(order: {
    id: string;
    userId: string | null;
    eventId: string;
    status: string;
    totalAmount: unknown;
    currency: string;
    stripePaymentIntentId: string | null;
    guestEmail: string | null;
    guestName: string | null;
    taxAmount: unknown;
    taxCountry: string | null;
    applicationFeeAmount: unknown;
    createdAt: Date;
    updatedAt: Date;
    event: { name: string };
    items: Array<{
      id: string;
      ticketTypeId: string;
      quantity: number;
      priceAtPurchase: unknown;
      ticketType: { name: string };
    }>;
  }): OrderPayload {
    return {
      id: order.id,
      userId: order.userId,
      eventId: order.eventId,
      eventName: order.event.name,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      stripePaymentIntentId: order.stripePaymentIntentId,
      guestEmail: order.guestEmail,
      guestName: order.guestName,
      taxAmount: order.taxAmount != null ? Number(order.taxAmount) : null,
      taxCountry: order.taxCountry,
      applicationFeeAmount: order.applicationFeeAmount != null ? Number(order.applicationFeeAmount) : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((i) => ({
        id: i.id,
        ticketTypeId: i.ticketTypeId,
        ticketTypeName: i.ticketType.name,
        quantity: i.quantity,
        priceAtPurchase: Number(i.priceAtPurchase),
      })),
    };
  }
}
