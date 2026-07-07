/**
 * Channel abstraction for outbound notifications.
 *
 * Today only email is implemented. WhatsApp and push are planned: adding one means
 * creating a class that implements NotificationChannel and registering it in
 * NotificationsModule — no caller (auth, payments, …) changes.
 */
export type NotificationChannelType = 'email' | 'whatsapp' | 'push';

/** Who to reach. A recipient may be reachable on some channels and not others. */
export interface NotificationRecipient {
  name?: string | null;
  email?: string | null;
  /** E.164-ish phone, used by WhatsApp/SMS later. */
  phone?: string | null;
  /** Device push token, used by the push channel later. */
  pushToken?: string | null;
}

/**
 * Channel-agnostic message content. Email uses subject + html (falling back to text);
 * WhatsApp/push will use subject as the title and text as the body.
 */
export interface NotificationMessage {
  subject: string;
  html?: string;
  text: string;
}

export interface NotificationChannel {
  readonly channel: NotificationChannelType;

  /** True when the channel is configured/enabled at runtime (e.g. SMTP creds present). */
  isEnabled(): boolean;

  /** True when this recipient can be reached on this channel (e.g. has an email). */
  supports(recipient: NotificationRecipient): boolean;

  /** Deliver the message. Implementations must not throw — log and swallow failures. */
  send(recipient: NotificationRecipient, message: NotificationMessage): Promise<void>;
}

/** DI token for the array of registered channels (multi-provider). */
export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
