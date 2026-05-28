import { Module } from '@nestjs/common';
import { SwishModule } from '../swish/swish.module';
import { OrdersModule } from '../orders/orders.module';
import { TicketsModule } from '../tickets/tickets.module';
import { SwishPaymentsController } from './swish-payments.controller';
import { SwishPaymentsService } from './swish-payments.service';

@Module({
  imports: [SwishModule, OrdersModule, TicketsModule],
  controllers: [SwishPaymentsController],
  providers: [SwishPaymentsService],
})
export class SwishPaymentsModule {}
