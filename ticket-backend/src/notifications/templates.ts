import { NotificationMessage } from './notification-channel.interface';

/** Shared branded HTML wrapper so every email looks consistent. */
function layout(appName: string, heading: string, bodyHtml: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">
    <h1 style="font-size:20px;margin:0 0 16px;">${heading}</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0 12px;" />
    <p style="font-size:12px;color:#888;margin:0;">Sent by ${escapeHtml(appName)}. If you weren't expecting this, you can ignore it.</p>
  </div>`;
}

/** Minimal HTML-escaping for interpolated user/content values. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

export function welcomeTemplate(appName: string, name: string | null): NotificationMessage {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const subject = `Welcome to ${appName}`;
  const html = layout(
    appName,
    `Welcome to ${escapeHtml(appName)}`,
    `<p>${greeting}</p>
     <p>Your account is ready. You can now browse events, buy tickets, and manage your orders.</p>`,
  );
  const text = `${greeting}\n\nWelcome to ${appName}. Your account is ready — you can now browse events, buy tickets, and manage your orders.`;
  return { subject, html, text };
}

export function passwordResetTemplate(appName: string, resetUrl: string): NotificationMessage {
  const subject = 'Reset your password';
  const html = layout(
    appName,
    'Reset your password',
    `<p>We received a request to reset your password.</p>
     <p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Choose a new password</a></p>
     <p style="font-size:13px;color:#666;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
  );
  const text = `We received a request to reset your password.\n\nChoose a new password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`;
  return { subject, html, text };
}

export interface OrderConfirmationData {
  appName: string;
  recipientName: string | null;
  eventName: string;
  orderId: string;
  currency: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  tickets: Array<{ ticketTypeName: string; uniqueCode: string }>;
  /** Optional link where the buyer can view/download tickets. */
  ticketsUrl?: string | null;
}

export function orderConfirmationTemplate(data: OrderConfirmationData): NotificationMessage {
  const greeting = data.recipientName ? `Hi ${escapeHtml(data.recipientName)},` : 'Hi,';
  const subject = `Your tickets for ${data.eventName}`;

  const itemsHtml = data.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0;">${escapeHtml(i.name)} × ${i.quantity}</td>
         <td style="padding:4px 0;text-align:right;">${money(i.price * i.quantity, data.currency)}</td></tr>`,
    )
    .join('');

  const ticketsHtml = data.tickets
    .map(
      (t) =>
        `<li style="margin:4px 0;">${escapeHtml(t.ticketTypeName)} — <code style="background:#f4f4f4;padding:2px 6px;border-radius:4px;">${escapeHtml(t.uniqueCode)}</code></li>`,
    )
    .join('');

  const ctaHtml = data.ticketsUrl
    ? `<p><a href="${escapeHtml(data.ticketsUrl)}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">View your tickets</a></p>`
    : '';

  const html = layout(
    data.appName,
    `You're going to ${escapeHtml(data.eventName)}!`,
    `<p>${greeting}</p>
     <p>Thanks for your order. Here's your confirmation for <strong>${escapeHtml(data.eventName)}</strong>.</p>
     <table style="width:100%;border-collapse:collapse;margin:12px 0;">
       ${itemsHtml}
       <tr><td style="padding:8px 0 0;border-top:1px solid #eee;font-weight:600;">Total</td>
       <td style="padding:8px 0 0;border-top:1px solid #eee;text-align:right;font-weight:600;">${money(data.total, data.currency)}</td></tr>
     </table>
     <p style="font-weight:600;margin:16px 0 4px;">Your tickets</p>
     <ul style="padding-left:18px;margin:0;">${ticketsHtml}</ul>
     ${ctaHtml}
     <p style="font-size:13px;color:#666;">Order reference: ${escapeHtml(data.orderId)}</p>`,
  );

  const textLines = [
    greeting,
    '',
    `Thanks for your order. Here's your confirmation for ${data.eventName}.`,
    '',
    ...data.items.map((i) => `- ${i.name} × ${i.quantity}: ${money(i.price * i.quantity, data.currency)}`),
    `Total: ${money(data.total, data.currency)}`,
    '',
    'Your tickets:',
    ...data.tickets.map((t) => `- ${t.ticketTypeName}: ${t.uniqueCode}`),
    ...(data.ticketsUrl ? ['', `View your tickets: ${data.ticketsUrl}`] : []),
    '',
    `Order reference: ${data.orderId}`,
  ];

  return { subject, html, text: textLines.join('\n') };
}
