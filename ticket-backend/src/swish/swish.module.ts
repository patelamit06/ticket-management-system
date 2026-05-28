import { Module } from '@nestjs/common';
import { SwishService } from './swish.service';

@Module({
  providers: [SwishService],
  exports: [SwishService],
})
export class SwishModule {}
