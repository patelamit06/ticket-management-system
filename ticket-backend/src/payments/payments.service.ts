import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { StripeService } from '../stripe/stripe.service';
import { TicketsService } from '../tickets/tickets.service';

const PLATFORM_FEE_PERCENT = 5;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly ordersService: OrdersService,
    private readonly ticketsService: TicketsService,
  ) {}

  /**
   * Create or return existing Stripe PaymentIntent for an order.
   * Uses Stripe Connect destination charge when organizer has a Connected Account (payout).
   */
  async createPaymentIntent(
    orderId: string,
    _dto?: { returnUrl?: string },
  ): Promise<{ clientSecret: string }> {
    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException('Payments are not configured');
    }

    const order = await this.ordersService.findByIdForPayment(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('Order is not pending payment');
    }

    const amountCents = Math.round(order.totalAmount * 100);
    if (amountCents < 1) {
      throw new BadRequestException('Order total must be at least 0.01');
    }

    const stripe = this.stripeService.getClient();

    if (order.stripePaymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      if (existing.status !== 'canceled') {
        return { clientSecret: existing.client_secret! };
      }
    }

    const applicationFeeCents = Math.floor(amountCents * (PLATFORM_FEE_PERCENT / 100));
    const params: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency: order.currency.toLowerCase(),
      metadata: { orderId },
      automatic_payment_methods: { enabled: true },
    };

    if (order.organizerStripeConnectAccountId) {
      params.transfer_data = {
        destination: order.organizerStripeConnectAccountId,
      };
      params.application_fee_amount = applicationFeeCents;
    }

    const paymentIntent = await stripe.paymentIntents.create(params);
    await this.ordersService.setPaymentIntentId(orderId, paymentIntent.id);

    return { clientSecret: paymentIntent.client_secret! };
  }

  /**
   * Create a Stripe Checkout Session (hosted payment page).
   * Frontend redirects user to the returned URL; no Stripe.js or publishable key needed on frontend.
   * Uses same Connect destination + platform fee as createPaymentIntent.
   */
  async createCheckoutSession(
    orderId: string,
    dto: { successUrl: string; cancelUrl: string },
  ): Promise<{ url: string }> {
    if (!this.stripeService.isConfigured()) {
      throw new BadRequestException('Payments are not configured');
    }

    const order = await this.ordersService.findByIdForPayment(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('Order is not pending payment');
    }

    const amountCents = Math.round(order.totalAmount * 100);
    if (amountCents < 1) {
      throw new BadRequestException('Order total must be at least 0.01');
    }

    const stripe = this.stripeService.getClient();
    const applicationFeeCents = Math.floor(amountCents * (PLATFORM_FEE_PERCENT / 100));

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: order.currency.toLowerCase(),
            unit_amount: amountCents,
            product_data: {
              name: order.eventName,
              description: `Order #${orderId.slice(0, 8)}`,
            },
          },
        },
      ],
      payment_intent_data: {
        metadata: { orderId },
        ...(order.organizerStripeConnectAccountId
          ? {
              application_fee_amount: applicationFeeCents,
              transfer_data: { destination: order.organizerStripeConnectAccountId },
            }
          : {}),
      },
    };

    const session = await stripe.checkout.sessions.create(params);
    if (!session.url) {
      throw new BadRequestException('Could not create checkout session');
    }
    return { url: session.url };
  }

  /**
   * Handle Stripe webhook (payment_intent.succeeded). Idempotent: if order already paid, skip.
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const stripe = this.stripeService.getClient();
    const secret = this.stripeService.getWebhookSecret();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${(err as Error).message}`);
    }

    if (event.type !== 'payment_intent.succeeded') {
      return;
    }

    const pi = event.data.object as Stripe.PaymentIntent;
    const orderIdFromMeta = pi.metadata?.orderId;
    const order = orderIdFromMeta
      ? await this.ordersService.findByIdForPayment(orderIdFromMeta)
      : null;

    if (!order) {
      return;
    }
    if (order.status === 'paid') {
      return;
    }

    await this.ordersService.markPaid(order.id, pi.id);
    await this.ticketsService.createForOrder(order.id);
  }
}
