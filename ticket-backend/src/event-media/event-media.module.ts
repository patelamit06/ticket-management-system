import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventMediaController } from './event-media.controller';
import { EventMediaService } from './event-media.service';

@Module({
  imports: [PrismaModule],
  controllers: [EventMediaController],
  providers: [EventMediaService],
  exports: [EventMediaService],
})
export class EventMediaModule {}
