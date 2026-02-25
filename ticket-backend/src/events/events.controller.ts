import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService, EventPayload } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

type User = { id: string; role: string };

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create event (any authenticated user becomes owner)' })
  @ApiResponse({ status: 201, description: 'Event created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Req() req: Request & { user: User },
    @Body() dto: CreateEventDto,
  ): Promise<EventPayload> {
    return this.eventsService.create(req.user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my events (organizer)' })
  @ApiResponse({ status: 200, description: 'List of events' })
  findMy(@Req() req: Request & { user: User }): Promise<EventPayload[]> {
    return this.eventsService.findMyEvents(req.user.id);
  }

  @Get('public')
  @ApiOperation({ summary: 'List published events (optional country/city filter)' })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of published events' })
  findPublic(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.eventsService.findPublic({
      country,
      city,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('public/:id')
  @ApiOperation({ summary: 'Get single published event by id' })
  @ApiResponse({ status: 200, description: 'Event detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOnePublic(@Param('id') id: string) {
    return this.eventsService.findOnePublic(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event (owner or super_admin only)' })
  @ApiResponse({ status: 200, description: 'Event detail' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
  ): Promise<EventPayload> {
    return this.eventsService.findOneForOrganizer(
      id,
      req.user.id,
      req.user.role === 'super_admin',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event (owner or super_admin only)' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
    @Body() dto: UpdateEventDto,
  ): Promise<EventPayload> {
    return this.eventsService.update(
      id,
      req.user.id,
      req.user.role === 'super_admin',
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event (owner or super_admin only)' })
  @ApiResponse({ status: 204, description: 'Event deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: User },
  ): Promise<void> {
    return this.eventsService.remove(
      id,
      req.user.id,
      req.user.role === 'super_admin',
    );
  }
}
