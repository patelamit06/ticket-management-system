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
import { TicketTypesService, TicketTypePayload } from './ticket-types.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

type User = { id: string; role: string };

@ApiTags('ticket-types')
@Controller('events/:eventId/ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add ticket type (organizer only)' })
  @ApiResponse({ status: 201, description: 'Ticket type created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  create(
    @Param('eventId') eventId: string,
    @Req() req: Request & { user: User },
    @Body() dto: CreateTicketTypeDto,
  ): Promise<TicketTypePayload> {
    return this.ticketTypesService.create(
      eventId,
      req.user.id,
      req.user.role === 'super_admin',
      dto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List ticket types for event (organizer only)' })
  @ApiResponse({ status: 200, description: 'List of ticket types' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Param('eventId') eventId: string,
    @Req() req: Request & { user: User },
  ): Promise<TicketTypePayload[]> {
    return this.ticketTypesService.findAllForEvent(
      eventId,
      req.user.id,
      req.user.role === 'super_admin',
    );
  }

  @Get('public')
  @ApiOperation({ summary: 'List ticket types for published event (no auth)' })
  @ApiResponse({ status: 200, description: 'List of ticket types' })
  @ApiResponse({ status: 404, description: 'Event not found or not published' })
  findPublic(@Param('eventId') eventId: string): Promise<TicketTypePayload[]> {
    return this.ticketTypesService.findPublicByEventId(eventId);
  }

  @Patch(':ticketTypeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket type (organizer only)' })
  @ApiResponse({ status: 200, description: 'Ticket type updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('eventId') eventId: string,
    @Param('ticketTypeId') ticketTypeId: string,
    @Req() req: Request & { user: User },
    @Body() dto: UpdateTicketTypeDto,
  ): Promise<TicketTypePayload> {
    return this.ticketTypesService.update(
      eventId,
      ticketTypeId,
      req.user.id,
      req.user.role === 'super_admin',
      dto,
    );
  }

  @Delete(':ticketTypeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ticket type (organizer only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Param('eventId') eventId: string,
    @Param('ticketTypeId') ticketTypeId: string,
    @Req() req: Request & { user: User },
  ): Promise<void> {
    return this.ticketTypesService.remove(
      eventId,
      ticketTypeId,
      req.user.id,
      req.user.role === 'super_admin',
    );
  }
}
