import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** Public: no auth – guests must be able to pay. */
  @Post('orders/:orderId/create-payment-intent')
  @ApiOperation({ summary: 'Create Stripe PaymentIntent; public so guests can pay' })
  @ApiResponse({ status: 201, description: 'clientSecret for Stripe Elements' })
  @ApiResponse({ status: 400, description: 'Order not pending or payments not configured' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  createPaymentIntent(
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<{ clientSecret: string }> {
    return this.paymentsService.createPaymentIntent(orderId, dto);
  }

  /** Public: no auth – guests must be able to pay. */
  @Post('orders/:orderId/checkout-session')
  @ApiOperation({ summary: 'Create Stripe Checkout Session; public so guests can pay' })
  @ApiResponse({ status: 201, description: 'url to redirect user to Stripe Checkout' })
  @ApiResponse({ status: 400, description: 'Order not pending or payments not configured' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  createCheckoutSession(
    @Param('orderId') orderId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<{ url: string }> {
    return this.paymentsService.createCheckoutSession(orderId, dto);
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook (payment_intent.succeeded); verify with STRIPE_WEBHOOK_SECRET' })
  @ApiResponse({ status: 200, description: 'Processed' })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      throw new BadRequestException('Missing raw body or stripe-signature');
    }
    await this.paymentsService.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
