import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

export interface EventPayload {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date;
  bannerUrl: string | null;
  status: string;
  organizerId: string;
  organizerName?: string | null;
  country: string | null;
  city: string | null;
  timezone: string | null;
  groupDiscountTiers: unknown;
  createdAt: Date;
  updatedAt: Date;
}

function toEventPayload(row: {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date;
  bannerUrl: string | null;
  status: string;
  organizerId: string;
  country: string | null;
  city: string | null;
  timezone: string | null;
  groupDiscountTiers: unknown;
  createdAt: Date;
  updatedAt: Date;
}): EventPayload {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    bannerUrl: row.bannerUrl,
    status: row.status,
    organizerId: row.organizerId,
    country: row.country,
    city: row.city,
    timezone: row.timezone,
    groupDiscountTiers: row.groupDiscountTiers,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEventDto): Promise<EventPayload> {
    const event = await this.prisma.event.create({
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        bannerUrl: dto.bannerUrl,
        status: 'draft',
        organizerId: userId,
        country: dto.country,
        city: dto.city,
        timezone: dto.timezone,
      },
    });
    return toEventPayload(event);
  }

  async findMyEvents(userId: string): Promise<EventPayload[]> {
    const list = await this.prisma.event.findMany({
      where: { organizerId: userId },
      orderBy: { startDate: 'asc' },
    });
    return list.map(toEventPayload);
  }

  async findOneForOrganizer(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
  ): Promise<EventPayload> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.organizerId !== userId && !isSuperAdmin) {
      throw new ForbiddenException('You can only access your own events');
    }
    return toEventPayload(event);
  }

  async update(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
    dto: UpdateEventDto,
  ): Promise<EventPayload> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.organizerId !== userId && !isSuperAdmin) {
      throw new ForbiddenException('Only the event owner or admin can update this event');
    }
    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.bannerUrl !== undefined && { bannerUrl: dto.bannerUrl }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      },
    });
    return toEventPayload(updated);
  }

  async remove(
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
      throw new ForbiddenException('Only the event owner or admin can delete this event');
    }
    await this.prisma.event.delete({ where: { id: eventId } });
  }

  /** Public: list published events with optional country/city filter (includes organizer name) */
  async findPublic(params: {
    country?: string;
    city?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: EventPayload[]; total: number }> {
    const where: { status: string; country?: string; city?: string } = {
      status: 'published',
    };
    if (params.country) where.country = params.country;
    if (params.city) where.city = params.city;
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { startDate: 'asc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
        include: { organizer: { select: { name: true } } },
      }),
      this.prisma.event.count({ where }),
    ]);
    return {
      events: events.map((ev) => ({
        ...toEventPayload(ev),
        organizerName: ev.organizer?.name ?? null,
      })),
      total,
    };
  }

  /** Public: get single published event by id (includes organizer name) */
  async findOnePublic(eventId: string): Promise<EventPayload | null> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, status: 'published' },
      include: { organizer: { select: { name: true } } },
    });
    if (!event) return null;
    const payload = toEventPayload(event);
    return { ...payload, organizerName: event.organizer?.name ?? null };
  }
}
