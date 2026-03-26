import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { TicketsService, TicketPayload } from './tickets.service';

type User = { id: string; role: string };

@ApiTags('tickets')
@Controller('orders')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':orderId/tickets')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tickets for an order (owner or guest with email)' })
  @ApiQuery({ name: 'email', required: false, description: 'Guest email for guest orders' })
  getOrderTickets(
    @Req() req: Request & { user?: User },
    @Param('orderId') orderId: string,
    @Query('email') email?: string,
  ): Promise<TicketPayload[]> {
    return this.ticketsService.getForOrder(orderId, req.user?.id, email);
  }
}
