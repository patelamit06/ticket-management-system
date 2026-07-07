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

  /**
   * Validate a scanned code. Single-ticket order items check in immediately;
   * group items (quantity > 1) return the group summary so staff can confirm
   * how many attendees to admit via confirmGroup(). A reused code is not an
   * error while unused sibling tickets remain — the group summary is returned
   * with scannedTicketUsedAt set so staff can admit from the remaining ones.
   */
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
            tickets: {
              select: { id: true, usedAt: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Invalid ticket code');
    }

    const group = ticket.orderItem.tickets;
    const groupTotal = group.length;
    const alreadyCheckedIn = group.filter((t) => t.usedAt !== null).length;
    const remaining = groupTotal - alreadyCheckedIn;
    const context = this.buildContext(ticket.orderItem);

    if (groupTotal === 1) {
      if (ticket.usedAt) {
        throw new ConflictException(
          `Ticket already used at ${ticket.usedAt.toISOString()}`,
        );
      }
      const now = new Date();
      const updated = await this.prisma.ticket.updateMany({
        where: { id: ticket.id, usedAt: null },
        data: { usedAt: now },
      });
      if (updated.count === 0) {
        // Lost a race with another scanner between read and write.
        throw new ConflictException('Ticket already used');
      }
      return {
        status: 'checkedIn' as const,
        success: true,
        checkedIn: 1,
        checkedInAt: now.toISOString(),
        ...context,
        groupTotal: 1,
        alreadyCheckedIn: 1,
        remaining: 0,
      };
    }

    if (remaining === 0) {
      throw new ConflictException(
        `All ${groupTotal} tickets in this group were already checked in`,
      );
    }

    return {
      status: 'group' as const,
      groupTotal,
      alreadyCheckedIn,
      remaining,
      ...context,
      scannedTicketUsedAt: ticket.usedAt?.toISOString() ?? null,
    };
  }

  /**
   * Check in `count` unused tickets from the scanned ticket's group (same
   * order item). The scanned ticket is consumed first when still unused.
   */
  async confirmGroup(uniqueCode: string, count: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { uniqueCode },
      include: {
        orderItem: {
          include: {
            ticketType: { include: { event: true } },
            order: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Invalid ticket code');
    }

    const now = new Date();
    const { groupTotal, remaining } = await this.prisma.$transaction(
      async (tx) => {
        const unused = await tx.ticket.findMany({
          where: { orderItemId: ticket.orderItemId, usedAt: null },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });
        if (unused.length < count) {
          throw new ConflictException(
            `Only ${unused.length} ticket(s) remaining in this group`,
          );
        }
        const orderedIds = [
          ...unused.filter((t) => t.id === ticket.id),
          ...unused.filter((t) => t.id !== ticket.id),
        ]
          .slice(0, count)
          .map((t) => t.id);

        const updated = await tx.ticket.updateMany({
          where: { id: { in: orderedIds }, usedAt: null },
          data: { usedAt: now },
        });
        if (updated.count !== count) {
          // Another scanner claimed some of these rows; roll back everything.
          throw new ConflictException(
            'Tickets were checked in concurrently — please rescan',
          );
        }
        const total = await tx.ticket.count({
          where: { orderItemId: ticket.orderItemId },
        });
        const stillUnused = await tx.ticket.count({
          where: { orderItemId: ticket.orderItemId, usedAt: null },
        });
        return { groupTotal: total, remaining: stillUnused };
      },
    );

    return {
      status: 'checkedIn' as const,
      success: true,
      checkedIn: count,
      checkedInAt: now.toISOString(),
      ...this.buildContext(ticket.orderItem),
      groupTotal,
      alreadyCheckedIn: groupTotal - remaining,
      remaining,
    };
  }

  private buildContext(orderItem: {
    order: { guestName: string | null; guestEmail: string | null };
    ticketType: { name: string; event: { name: string } };
  }) {
    return {
      attendeeName: orderItem.order.guestName,
      attendeeEmail: orderItem.order.guestEmail,
      ticketTypeName: orderItem.ticketType.name,
      eventName: orderItem.ticketType.event.name,
    };
  }
}
