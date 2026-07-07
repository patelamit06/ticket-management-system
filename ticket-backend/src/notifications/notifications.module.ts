import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmailChannel } from './channels/email.channel';
import { NOTIFICATION_CHANNELS } from './notification-channel.interface';

/**
 * Global so any module (auth, payments, …) can inject NotificationsService
 * without importing this module explicitly.
 *
 * To add a channel: create the class (implements NotificationChannel), add it to
 * `providers`, and include it in the NOTIFICATION_CHANNELS `useFactory`/`inject`.
 * Example (WhatsApp):
 *   providers: [..., WhatsAppChannel]
 *   { provide: NOTIFICATION_CHANNELS,
 *     useFactory: (email, whatsapp) => [email, whatsapp],
 *     inject: [EmailChannel, WhatsAppChannel] }
 */
@Global()
@Module({
  providers: [
    NotificationsService,
    EmailChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (email: EmailChannel) => [email],
      inject: [EmailChannel],
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
