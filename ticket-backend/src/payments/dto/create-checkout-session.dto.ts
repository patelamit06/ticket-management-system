import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({ description: 'Full URL to redirect to after successful payment (e.g. https://yoursite.com/orders/ord_123/success)' })
  @IsString()
  @IsUrl()
  successUrl!: string;

  @ApiProperty({ description: 'Full URL to redirect to if user cancels (e.g. https://yoursite.com/orders/ord_123/pay)' })
  @IsString()
  @IsUrl()
  cancelUrl!: string;
}
