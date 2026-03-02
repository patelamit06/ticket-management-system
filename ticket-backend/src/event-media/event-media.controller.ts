import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventMediaService, EventMediaPayload } from './event-media.service';
import { CreateEventMediaDto } from './dto/create-event-media.dto';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { ReorderEventMediaDto } from './dto/reorder-event-media.dto';

type User = { id: string; role: string };

@ApiTags('event-media')
@Controller('events/:eventId/media')
export class EventMediaController {
  constructor(private readonly service: EventMediaService) {}

  @Post('presigned-upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned PUT URL for direct image upload (organizer only)' })
  @ApiResponse({ status: 201, description: 'uploadUrl, objectKey, publicUrl' })
  @ApiResponse({ status: 400, description: 'Invalid contentType or MinIO not configured' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getPresignedUpload(
    @Param('eventId') eventId: string,
    @Req() req: Request & { user: User },
    @Body() dto: PresignedUploadDto,
  ): Promise<{ uploadUrl: string; objectKey: string; publicUrl: string }> {
    return this.service.getPresignedUpload(
      eventId,
      req.user.id,
      req.user.role === 'super_admin',
      dto.contentType,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add media: video link (url) or confirm image (objectKey from presigned-upload)' })
  @ApiResponse({ status: 201, description: 'Media created' })
  @ApiResponse({ status: 400, description: 'Invalid body' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  create(
    @Param('eventId') eventId: string,
    @Req() req: Request & { user: User },
    @Body() dto: CreateEventMediaDto,
  ): Promise<EventMediaPayload> {
    return this.service.create(
      eventId,
      req.user.id,
      req.user.role === 'super_admin',
      dto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List media for event (organizer only)' })
  @ApiResponse({ status: 200, description: 'List of media' })
  findAll(
    @Param('eventId') eventId: string,
    @Req() req: Request & { user: User },
  ): Promise<EventMediaPayload[]> {
    return this.service.findAllForEvent(
      eventId,
      req.user.id,
      req.user.role === 'super_admin',
    );
  }

  @Get('public')
  @ApiOperation({ summary: 'List media for published event (no auth)' })
  @ApiResponse({ status: 200, description: 'List of media' })
  @ApiResponse({ status: 404, description: 'Event not found or not published' })
  findPublic(@Param('eventId') eventId: string): Promise<EventMediaPayload[]> {
    return this.service.findPublicByEventId(eventId);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder media (organizer only)' })
  @ApiResponse({ status: 200, description: 'Updated list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  reorder(
    @Param('eventId') eventId: string,
    @Req() req: Request & { user: User },
    @Body() dto: ReorderEventMediaDto,
  ): Promise<EventMediaPayload[]> {
    return this.service.reorder(
      eventId,
      req.user.id,
      req.user.role === 'super_admin',
      dto.mediaIds,
    );
  }

  @Delete(':mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete media (organizer only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Param('eventId') eventId: string,
    @Param('mediaId') mediaId: string,
    @Req() req: Request & { user: User },
  ): Promise<void> {
    return this.service.remove(
      eventId,
      mediaId,
      req.user.id,
      req.user.role === 'super_admin',
    );
  }
}
