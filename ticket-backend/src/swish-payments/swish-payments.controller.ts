import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSwishPaymentDto } from './dto/create-swish-payment.dto';
import {
  CreateSwishPaymentResult,
  SwishPaymentsService,
} from './swish-payments.service';
import { SwishPaymentResponse } from '../swish/swish.types';

@ApiTags('payments')
@Controller('payments/swish')
export class SwishPaymentsController {
  constructor(private readonly swishPayments: SwishPaymentsService) {}

  /** Public: guests must be able to pay. */
  @Post('orders/:orderId')
  @ApiOperation({ summary: 'Create a Swish payment request for an order' })
  @ApiResponse({ status: 201, description: 'Swish payment created; returns token + ids' })
  createPayment(
    @Param('orderId') orderId: string,
    @Body() dto: CreateSwishPaymentDto,
  ): Promise<CreateSwishPaymentResult> {
    return this.swishPayments.createPayment(orderId, dto);
  }

  /** Public: poll Swish for status — fallback when callback hasn't arrived yet. */
  @Post(':swishPaymentRequestId/verify')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify a Swish payment with Swish (callback fallback)' })
  @ApiResponse({ status: 200, description: 'Current status' })
  verifyPayment(
    @Param('swishPaymentRequestId') id: string,
  ): Promise<{ status: string }> {
    return this.swishPayments.verifyPayment(id);
  }

  /**
   * Swish posts here when payment status changes. Must be HTTPS, publicly reachable,
   * and (in prod) protected by mTLS at the load balancer using Swish's CA.
   */
  @Post('callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Swish callback (status change)' })
  async handleCallback(@Body() body: SwishPaymentResponse): Promise<{ received: true }> {
    await this.swishPayments.handleCallback(body);
    return { received: true };
  }
}
