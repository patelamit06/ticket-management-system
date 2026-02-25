import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

export interface TicketTypePayload {
  id: string;
  eventId: string;
  name: string;
  price: number;
  quantity: number;
  maxPerOrder: number;
  availabilityStart: Date | null;
  availabilityEnd: Date | null;
  ageMin: number | null;
  ageMax: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

function toPayload(row: {
  id: string;
  eventId: string;
  name: string;
  price: unknown;
  quantity: number;
  maxPerOrder: number;
  availabilityStart: Date | null;
  availabilityEnd: Date | null;
  ageMin: number | null;
  ageMax: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): TicketTypePayload {
  return {
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    price: Number(row.price),
    quantity: row.quantity,
    maxPerOrder: row.maxPerOrder,
    availabilityStart: row.availabilityStart,
    availabilityEnd: row.availabilityEnd,
    ageMin: row.ageMin,
    ageMax: row.ageMax,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class TicketTypesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertEventAccess(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
  ): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.organizerId !== userId && !isSuperAdmin) {
      throw new ForbiddenException('Only the event organizer can manage ticket types');
    }
  }

  async create(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
    dto: CreateTicketTypeDto,
  ): Promise<TicketTypePayload> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const created = await this.prisma.ticketType.create({
      data: {
        eventId,
        name: dto.name,
        price: dto.price,
        quantity: dto.quantity ?? 0,
        maxPerOrder: dto.maxPerOrder ?? 10,
        availabilityStart: dto.availabilityStart
          ? new Date(dto.availabilityStart)
          : null,
        availabilityEnd: dto.availabilityEnd
          ? new Date(dto.availabilityEnd)
          : null,
        ageMin: dto.ageMin ?? null,
        ageMax: dto.ageMax ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return toPayload(created);
  }

  async findAllForEvent(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
  ): Promise<TicketTypePayload[]> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const list = await this.prisma.ticketType.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return list.map(toPayload);
  }

  async findPublicByEventId(eventId: string): Promise<TicketTypePayload[]> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, status: 'published' },
    });
    if (!event) {
      throw new NotFoundException('Event not found or not published');
    }
    const list = await this.prisma.ticketType.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return list.map(toPayload);
  }

  async update(
    eventId: string,
    ticketTypeId: string,
    userId: string,
    isSuperAdmin: boolean,
    dto: UpdateTicketTypeDto,
  ): Promise<TicketTypePayload> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const existing = await this.prisma.ticketType.findFirst({
      where: { id: ticketTypeId, eventId },
    });
    if (!existing) {
      throw new NotFoundException('Ticket type not found');
    }
    const updated = await this.prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.maxPerOrder !== undefined && { maxPerOrder: dto.maxPerOrder }),
        ...(dto.availabilityStart !== undefined && {
          availabilityStart: new Date(dto.availabilityStart),
        }),
        ...(dto.availabilityEnd !== undefined && {
          availabilityEnd: new Date(dto.availabilityEnd),
        }),
        ...(dto.ageMin !== undefined && { ageMin: dto.ageMin }),
        ...(dto.ageMax !== undefined && { ageMax: dto.ageMax }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
    return toPayload(updated);
  }

  async remove(
    eventId: string,
    ticketTypeId: string,
    userId: string,
    isSuperAdmin: boolean,
  ): Promise<void> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const existing = await this.prisma.ticketType.findFirst({
      where: { id: ticketTypeId, eventId },
    });
    if (!existing) {
      throw new NotFoundException('Ticket type not found');
    }
    await this.prisma.ticketType.delete({ where: { id: ticketTypeId } });
  }
}
