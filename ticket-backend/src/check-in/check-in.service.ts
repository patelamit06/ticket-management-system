import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckInService {
  constructor(private readonly prisma: PrismaService) {}

  /** Check-in stats for an event. Organizer-only. */
  async getEventStats(eventId: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, name: true },
    });
    if (!event || event.organizerId !== organizerId) {
      throw new ForbiddenException('You do not have access to this event');
    }

    const tickets = await this.prisma.ticket.findMany({
      where: {
        orderItem: {
          order: { eventId, status: 'paid' },
        },
      },
      select: { id: true, usedAt: true },
    });

    const total = tickets.length;
    const checkedIn = tickets.filter((t) => t.usedAt !== null).length;

    return {
      total,
      checkedIn,
      remaining: total - checkedIn,
    };
  }

  async scan(uniqueCode: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { uniqueCode },
      include: {
        orderItem: {
          include: {
            ticketType: {
              include: { event: true },
            },
            order: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Invalid ticket code');
    }

    if (ticket.usedAt) {
      throw new ConflictException(
        `Ticket already used at ${ticket.usedAt.toISOString()}`,
      );
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { usedAt: new Date() },
    });

    return {
      success: true,
      checkedInAt: updated.usedAt!.toISOString(),
      attendeeName: ticket.orderItem.order.guestName,
      attendeeEmail: ticket.orderItem.order.guestEmail,
      ticketTypeName: ticket.orderItem.ticketType.name,
      eventName: ticket.orderItem.ticketType.event.name,
    };
  }
}
