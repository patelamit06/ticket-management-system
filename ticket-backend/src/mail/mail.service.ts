import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Sends transactional email via the Resend HTTP API (no SDK needed — plain fetch).
 * When RESEND_API_KEY is not configured (e.g. local dev), the message is logged
 * instead of sent so the flow remains testable without an email provider.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const subject = 'Reset your password';
    const html = `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('MAIL_FROM', 'onboarding@resend.dev');

    if (!apiKey) {
      // Dev fallback: no provider configured. Log so the reset link is still reachable.
      this.logger.warn(
        `RESEND_API_KEY not set — email to ${to} not sent. Subject: "${subject}". Body: ${html}`,
      );
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      // Don't leak provider errors to the caller; log and swallow so the generic
      // "if an account exists…" response is preserved.
      this.logger.error(`Failed to send email to ${to}: ${res.status} ${detail}`);
    }
  }
}
