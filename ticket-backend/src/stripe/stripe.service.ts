import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null;
  private readonly webhookSecret: string | null;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    this.stripe = secretKey ? new Stripe(secretKey, { apiVersion: '2026-02-25.clover' }) : null;
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim() ?? null;
  }

  getClient(): Stripe {
    if (!this.stripe) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    return this.stripe;
  }

  getWebhookSecret(): string {
    if (!this.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    return this.webhookSecret;
  }

  isConfigured(): boolean {
    return !!this.stripe && !!this.webhookSecret;
  }
}
