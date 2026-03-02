import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { CreateEventMediaDto } from './dto/create-event-media.dto';

export interface EventMediaPayload {
  id: string;
  eventId: string;
  type: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Use localhost in image URLs so browser (localhost:3000) and resource match; avoids provisional headers / CORS issues. */
function urlForBrowser(url: string): string {
  if (typeof url !== 'string') return url;
  return url.replace(/^http:\/\/127\.0\.0\.1:9000\//, 'http://localhost:9000/');
}

function toPayload(row: {
  id: string;
  eventId: string;
  type: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): EventMediaPayload {
  return {
    id: row.id,
    eventId: row.eventId,
    type: row.type,
    url: urlForBrowser(row.url),
    caption: row.caption,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Normalize YouTube watch URL to embed URL for consistent storage/display. */
function normalizeVideoUrl(url: string): string {
  const trimmed = url.trim();
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  return trimmed;
}

@Injectable()
export class EventMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  private async assertEventAccess(eventId: string, userId: string, isSuperAdmin: boolean): Promise<void> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== userId && !isSuperAdmin) {
      throw new ForbiddenException('Only the event organizer can manage media');
    }
  }

  /**
   * Get a presigned PUT URL for direct upload to MinIO. Client uploads the file to uploadUrl,
   * then calls create with type 'image' and this objectKey.
   */
  async getPresignedUpload(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
    contentType: string,
  ): Promise<{ uploadUrl: string; objectKey: string; publicUrl: string }> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    if (!this.minio.isAvailable()) {
      throw new BadRequestException('File upload is not configured (MinIO). Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY in .env');
    }
    const normalized = contentType === 'image/jpg' ? 'image/jpeg' : contentType;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(normalized)) {
      throw new BadRequestException('Invalid content type. Use image/jpeg, image/png, image/gif, or image/webp.');
    }
    const ext = normalized === 'image/jpeg' ? 'jpg' : normalized.split('/')[1] ?? 'jpg';
    const objectKey = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    try {
      const uploadUrl = await this.minio.getPresignedPutUrl(objectKey);
      const publicUrl = this.minio.getPublicUrl(objectKey);
      return { uploadUrl, objectKey, publicUrl };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'MinIO error';
      throw new ServiceUnavailableException(
        `Storage unavailable: ${message}. Ensure MinIO is running (docker-compose up -d) and reachable at MINIO_ENDPOINT:MINIO_PORT.`,
      );
    }
  }

  /**
   * Create EventMedia record for an image after client has uploaded to MinIO via presigned URL.
   * Validates that objectKey is under this event.
   */
  async confirmImageUpload(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
    objectKey: string,
    caption?: string,
  ): Promise<EventMediaPayload> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    if (!objectKey.startsWith(`${eventId}/`)) {
      throw new BadRequestException('Invalid object key for this event');
    }
    const url = this.minio.getPublicUrl(objectKey);
    const count = await this.prisma.eventMedia.count({ where: { eventId } });
    const created = await this.prisma.eventMedia.create({
      data: {
        eventId,
        type: 'image',
        url,
        caption: caption ?? null,
        sortOrder: count,
      },
    });
    return toPayload(created);
  }

  /**
   * Create media: video (url) or image (objectKey after presigned upload).
   */
  async create(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
    dto: CreateEventMediaDto,
  ): Promise<EventMediaPayload> {
    if (dto.type === 'video') {
      if (!dto.url) throw new BadRequestException('url is required for video');
      return this.addVideo(eventId, userId, isSuperAdmin, {
        type: 'video',
        url: dto.url,
        caption: dto.caption,
      });
    }
    if (dto.type === 'image') {
      if (!dto.objectKey) throw new BadRequestException('objectKey is required for image');
      return this.confirmImageUpload(eventId, userId, isSuperAdmin, dto.objectKey, dto.caption);
    }
    throw new BadRequestException('type must be image or video');
  }

  private async addVideo(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
    dto: { type: 'video'; url: string; caption?: string },
  ): Promise<EventMediaPayload> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const url = normalizeVideoUrl(dto.url);
    const count = await this.prisma.eventMedia.count({ where: { eventId } });
    const created = await this.prisma.eventMedia.create({
      data: {
        eventId,
        type: 'video',
        url,
        caption: dto.caption ?? null,
        sortOrder: count,
      },
    });
    return toPayload(created);
  }

  async findAllForEvent(eventId: string, userId: string, isSuperAdmin: boolean): Promise<EventMediaPayload[]> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const list = await this.prisma.eventMedia.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return list.map(toPayload);
  }

  async findPublicByEventId(eventId: string): Promise<EventMediaPayload[]> {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, status: 'published' } });
    if (!event) throw new NotFoundException('Event not found or not published');
    const list = await this.prisma.eventMedia.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return list.map(toPayload);
  }

  async reorder(
    eventId: string,
    userId: string,
    isSuperAdmin: boolean,
    mediaIds: string[],
  ): Promise<EventMediaPayload[]> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    for (let i = 0; i < mediaIds.length; i++) {
      await this.prisma.eventMedia.updateMany({
        where: { id: mediaIds[i], eventId },
        data: { sortOrder: i },
      });
    }
    return this.findAllForEvent(eventId, userId, isSuperAdmin);
  }

  async remove(eventId: string, mediaId: string, userId: string, isSuperAdmin: boolean): Promise<void> {
    await this.assertEventAccess(eventId, userId, isSuperAdmin);
    const existing = await this.prisma.eventMedia.findFirst({ where: { id: mediaId, eventId } });
    if (!existing) throw new NotFoundException('Media not found');
    await this.prisma.eventMedia.delete({ where: { id: mediaId } });
  }
}
