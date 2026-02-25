import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventDiscountsController } from './event-discounts.controller';
import { EventDiscountsService } from './event-discounts.service';

@Module({
  imports: [PrismaModule],
  controllers: [EventDiscountsController],
  providers: [EventDiscountsService],
  exports: [EventDiscountsService],
})
export class EventDiscountsModule {}
