import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CheckInService } from './check-in.service';
import { CheckInController } from './check-in.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CheckInController],
  providers: [CheckInService],
})
export class CheckInModule {}
