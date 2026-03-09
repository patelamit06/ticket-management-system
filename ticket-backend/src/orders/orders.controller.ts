import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { OrdersService, OrderPayload } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

type User = { id: string; role: string };

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create order (guest or authenticated)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Validation or capacity error' })
  create(
    @Req() req: Request & { user?: User },
    @Body() dto: CreateOrderDto,
  ): Promise<OrderPayload> {
    return this.ordersService.create(dto, req.user?.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my orders' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  findMy(@Req() req: Request & { user: User }): Promise<OrderPayload[]> {
    return this.ordersService.findMy(req.user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get order by ID (owner or guest with email)' })
  @ApiQuery({ name: 'email', required: false, description: 'Guest email for guest orders' })
  @ApiResponse({ status: 200, description: 'Order' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @Req() req: Request & { user?: User },
    @Param('id') id: string,
    @Query('email') email?: string,
  ): Promise<OrderPayload> {
    const order = await this.ordersService.findOne(id, req.user?.id, email);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
