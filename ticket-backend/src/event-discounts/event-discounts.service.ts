import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDiscountDto } from './dto/create-event-discount.dto';
import { UpdateEventDiscountDto } from './dto/update-event-discount.dto';

export interface EventDiscountPayload {
  id: string;
  eventId: string;
  name: string;
  type: string;
  discountPercent: number;
  validTo: Date | null;
  minQuantity: number | null;
  ticketTypeIds: string[] | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

function toPayload(row: {
  id: string;
  eventId: string;
  name: string;
  type: string;
  discountPercent: unknown;
  validTo: Date | null;
  minQuantity: number | null;
  ticketTypeIds: unknown;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): EventDiscountPayload {
  const ids = row.ticketTypeIds;
  return {
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    type: row.type,
    discountPercent: Number(row.discountPercent),
    validTo: row.validTo,
    minQuantity: row.minQuantity,
    ticketTypeIds: Array.isArray(ids) ? ids : null,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class EventDiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertEventAccess(eventId: string, userId: string, isSuperAdmin: boolean): Promise<void> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== userId && !isSuperAdmin) {
      throw new ForbiddenException('Only the event organizer can manage discounts');
    }
  }

  async create(eventId: string, userId: string, isSuperAdmin: boolean, dto: CreateEventDiscountDto): Promise<EventDiscountPayload> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const created = await this.prisma.eventDiscount.create({
      data: {
        eventId,
        name: dto.name,
        type: dto.type,
        discountPercent: dto.discountPercent,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        minQuantity: dto.minQuantity ?? null,
        ticketTypeIds: dto.ticketTypeIds != null ? dto.ticketTypeIds : undefined,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return toPayload(created);
  }

  async findAllForEvent(eventId: string, userId: string, isSuperAdmin: boolean): Promise<EventDiscountPayload[]> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const list = await this.prisma.eventDiscount.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return list.map(toPayload);
  }

  async findPublicByEventId(eventId: string): Promise<EventDiscountPayload[]> {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, status: 'published' } });
    if (!event) throw new NotFoundException('Event not found or not published');
    const list = await this.prisma.eventDiscount.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return list.map(toPayload);
  }

  async update(eventId: string, discountId: string, userId: string, isSuperAdmin: boolean, dto: UpdateEventDiscountDto): Promise<EventDiscountPayload> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const existing = await this.prisma.eventDiscount.findFirst({ where: { id: discountId, eventId } });
    if (!existing) throw new NotFoundException('Discount not found');
    const updated = await this.prisma.eventDiscount.update({
      where: { id: discountId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.discountPercent !== undefined && { discountPercent: dto.discountPercent }),
        ...(dto.validTo !== undefined && { validTo: dto.validTo ? new Date(dto.validTo) : null }),
        ...(dto.minQuantity !== undefined && { minQuantity: dto.minQuantity }),
        ...(dto.ticketTypeIds !== undefined && { ticketTypeIds: dto.ticketTypeIds as Prisma.InputJsonValue }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
    return toPayload(updated);
  }

  async remove(eventId: string, discountId: string, userId: string, isSuperAdmin: boolean): Promise<void> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const existing = await this.prisma.eventDiscount.findFirst({ where: { id: discountId, eventId } });
    if (!existing) throw new NotFoundException('Discount not found');
    await this.prisma.eventDiscount.delete({ where: { id: discountId } });
  }
}
