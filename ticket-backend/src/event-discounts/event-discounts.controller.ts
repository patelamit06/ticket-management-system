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
import { EventDiscountsService, EventDiscountPayload } from './event-discounts.service';
import { CreateEventDiscountDto } from './dto/create-event-discount.dto';
import { UpdateEventDiscountDto } from './dto/update-event-discount.dto';

type User = { id: string; role: string };

@ApiTags('event-discounts')
@Controller('events/:eventId/discounts')
export class EventDiscountsController {
  constructor(private readonly service: EventDiscountsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add discount (organizer only)' })
  @ApiResponse({ status: 201, description: 'Discount created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  create(
    @Param('eventId') eventId: string,
    @Req() req: Request & { user: User },
    @Body() dto: CreateEventDiscountDto,
  ): Promise<EventDiscountPayload> {
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
  @ApiOperation({ summary: 'List discounts for event (organizer only)' })
  @ApiResponse({ status: 200, description: 'List of discounts' })
  findAll(
    @Param('eventId') eventId: string,
    @Req() req: Request & { user: User },
  ): Promise<EventDiscountPayload[]> {
    return this.service.findAllForEvent(
      eventId,
      req.user.id,
      req.user.role === 'super_admin',
    );
  }

  @Get('public')
  @ApiOperation({ summary: 'List discounts for published event (no auth)' })
  @ApiResponse({ status: 200, description: 'List of discounts' })
  @ApiResponse({ status: 404, description: 'Event not found or not published' })
  findPublic(@Param('eventId') eventId: string): Promise<EventDiscountPayload[]> {
    return this.service.findPublicByEventId(eventId);
  }

  @Patch(':discountId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update discount (organizer only)' })
  @ApiResponse({ status: 200, description: 'Discount updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('eventId') eventId: string,
    @Param('discountId') discountId: string,
    @Req() req: Request & { user: User },
    @Body() dto: UpdateEventDiscountDto,
  ): Promise<EventDiscountPayload> {
    return this.service.update(
      eventId,
      discountId,
      req.user.id,
      req.user.role === 'super_admin',
      dto,
    );
  }

  @Delete(':discountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete discount (organizer only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @Param('eventId') eventId: string,
    @Param('discountId') discountId: string,
    @Req() req: Request & { user: User },
  ): Promise<void> {
    return this.service.remove(
      eventId,
      discountId,
      req.user.id,
      req.user.role === 'super_admin',
    );
  }
}
