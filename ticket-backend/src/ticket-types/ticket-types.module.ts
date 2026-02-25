import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TicketTypesController } from './ticket-types.controller';
import { TicketTypesService } from './ticket-types.service';

@Module({
  imports: [PrismaModule],
  controllers: [TicketTypesController],
  providers: [TicketTypesService],
  exports: [TicketTypesService],
})
export class TicketTypesModule {}
