import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiPropertyOptional({ description: 'Return URL after payment (for redirect)' })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}
