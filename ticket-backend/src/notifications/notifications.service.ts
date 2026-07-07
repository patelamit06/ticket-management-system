import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  NOTIFICATION_CHANNELS,
  NotificationChannel,
  NotificationChannelType,
  NotificationMessage,
  NotificationRecipient,
} from './notification-channel.interface';
import {
  orderConfirmationTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from './templates';

/**
 * Entry point for sending notifications. Callers use the intent-named methods
 * (sendWelcome, sendPasswordReset, sendOrderConfirmation); this service renders
 * the content and fans it out across the registered channels.
 *
 * Extensibility: register a new NotificationChannel in NotificationsModule and it
 * automatically participates in dispatch — no changes here or at call sites.
 * `channels` on dispatch() lets a specific notification opt into a subset later
 * (e.g. order confirmation over email + WhatsApp, but not push).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(NOTIFICATION_CHANNELS) private readonly channels: NotificationChannel[],
  ) {}

  private get appName(): string {
    return this.config.get<string>('APP_NAME', 'Tikitlo');
  }

  async sendWelcome(recipient: NotificationRecipient): Promise<void> {
    await this.dispatch(recipient, welcomeTemplate(this.appName, recipient.name ?? null));
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    // Restrict to email: a password reset link should only go to the account's inbox.
    await this.dispatch({ email }, passwordResetTemplate(this.appName, resetUrl), ['email']);
  }

  /**
   * Send the order confirmation + issued tickets for a paid order.
   * Self-contained: gathers everything it needs and never throws, so payment
   * flows can call it without a guard.
   */
  async sendOrderConfirmation(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          event: { select: { name: true } },
          user: { select: { email: true, name: true } },
          items: {
            include: { ticketType: { select: { name: true } }, tickets: true },
          },
        },
      });
      if (!order) {
        this.logger.warn(`Order ${orderId} not found — no confirmation sent.`);
        return;
      }

      const email = order.user?.email ?? order.guestEmail;
      const name = order.user?.name ?? order.guestName ?? null;
      if (!email) {
        this.logger.warn(`Order ${orderId} has no recipient email — no confirmation sent.`);
        return;
      }

      const items = order.items.map((i) => ({
        name: i.ticketType.name,
        quantity: i.quantity,
        price: Number(i.priceAtPurchase),
      }));
      const tickets = order.items.flatMap((i) =>
        i.tickets.map((t) => ({ ticketTypeName: i.ticketType.name, uniqueCode: t.uniqueCode })),
      );

      const frontendUrl = this.config
        .get<string>('FRONTEND_URL', 'http://localhost:3000')
        .split(',')[0]
        .trim();

      const message = orderConfirmationTemplate({
        appName: this.appName,
        recipientName: name,
        eventName: order.event.name,
        orderId: order.id,
        currency: order.currency,
        total: Number(order.totalAmount),
        items,
        tickets,
        ticketsUrl: `${frontendUrl}/orders/${order.id}`,
      });

      await this.dispatch({ email, name }, message);
    } catch (err) {
      this.logger.error(
        `Failed to build/send order confirmation for ${orderId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Fan a message out to every enabled channel that supports the recipient.
   * `only` restricts to specific channel types when a notification shouldn't use all of them.
   */
  private async dispatch(
    recipient: NotificationRecipient,
    message: NotificationMessage,
    only?: NotificationChannelType[],
  ): Promise<void> {
    const targets = this.channels.filter(
      (c) =>
        (!only || only.includes(c.channel)) && c.isEnabled() && c.supports(recipient),
    );

    if (targets.length === 0) {
      this.logger.warn(
        `No enabled channel could deliver "${message.subject}" to ${recipient.email ?? recipient.phone ?? 'recipient'}.`,
      );
      return;
    }

    await Promise.all(
      targets.map((c) =>
        c
          .send(recipient, message)
          .catch((err) =>
            this.logger.error(`Channel ${c.channel} failed: ${(err as Error).message}`),
          ),
      ),
    );
  }
}
