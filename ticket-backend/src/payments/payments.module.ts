import { Module } from '@nestjs/common';
import { StripeModule } from '../stripe/stripe.module';
import { OrdersModule } from '../orders/orders.module';
import { TicketsModule } from '../tickets/tickets.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [StripeModule, OrdersModule, TicketsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
