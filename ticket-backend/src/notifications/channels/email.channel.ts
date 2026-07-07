import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  NotificationChannel,
  NotificationMessage,
  NotificationRecipient,
} from '../notification-channel.interface';

/**
 * Email channel over SMTP (nodemailer). Configured for Gmail by default
 * (SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_SECURE=true) using an app password,
 * but any SMTP provider works via the same env vars.
 *
 * When SMTP is not configured (e.g. local dev), messages are logged instead of sent
 * so flows stay testable without a mail server.
 */
@Injectable()
export class EmailChannel implements NotificationChannel {
  readonly channel = 'email' as const;
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(
      this.config.get<string>('SMTP_HOST') &&
        this.config.get<string>('SMTP_USER') &&
        this.config.get<string>('SMTP_PASS'),
    );
  }

  supports(recipient: NotificationRecipient): boolean {
    return Boolean(recipient.email);
  }

  async send(recipient: NotificationRecipient, message: NotificationMessage): Promise<void> {
    const to = recipient.email;
    if (!to) return;

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(
        `SMTP not configured — email to ${to} not sent. Subject: "${message.subject}".`,
      );
      return;
    }

    const from = this.config.get<string>('MAIL_FROM') ?? this.config.get<string>('SMTP_USER')!;
    try {
      await transporter.sendMail({
        from,
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      this.logger.log(`Email sent to ${to}: "${message.subject}"`);
    } catch (err) {
      // Never propagate: a failed notification must not break the triggering flow.
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  /** Lazily build (and cache) the SMTP transport from config. */
  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (!host || !user || !pass) return null;

    const port = Number(this.config.get<string>('SMTP_PORT') ?? '465');
    // secure=true for implicit TLS (port 465); false for STARTTLS (port 587).
    const secure = (this.config.get<string>('SMTP_SECURE') ?? 'true') !== 'false';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    return this.transporter;
  }
}
