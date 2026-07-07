import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { TicketTypesModule } from './ticket-types/ticket-types.module';
import { EventDiscountsModule } from './event-discounts/event-discounts.module';
import { EventMediaModule } from './event-media/event-media.module';
import { S3Module } from './s3/s3.module';
import { StripeModule } from './stripe/stripe.module';
import { SwishModule } from './swish/swish.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { SwishPaymentsModule } from './swish-payments/swish-payments.module';
import { TicketsModule } from './tickets/tickets.module';
import { CheckInModule } from './check-in/check-in.module';
import { AdminModule } from './admin/admin.module';
import { ReportsModule } from './reports/reports.module';
import { CountriesModule } from './countries/countries.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    CountriesModule,
    UsersModule,
    EventsModule,
    TicketTypesModule,
    EventDiscountsModule,
    EventMediaModule,
    S3Module,
    StripeModule,
    SwishModule,
    OrdersModule,
    PaymentsModule,
    SwishPaymentsModule,
    TicketsModule,
    CheckInModule,
    AdminModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
