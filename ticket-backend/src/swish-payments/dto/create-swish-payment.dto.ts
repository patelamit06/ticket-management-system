import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateSwishPaymentDto {
  /**
   * Optional payer phone in E.164 digits without "+" (e.g. 46712345678).
   * If provided, Swish runs the M-Commerce flow (push to the payer's Swish app).
   * If omitted, runs the E-Commerce flow — the frontend must render a QR from paymentRequestToken.
   */
  @ApiPropertyOptional({ description: 'Payer phone (digits only, with country code, e.g. 46712345678)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{8,15}$/, { message: 'payerAlias must be digits only, 8–15 chars' })
  payerAlias?: string;

  @ApiPropertyOptional({ description: 'Optional message shown in the Swish app (<=50 chars, [A-Za-z0-9:;.,?!()" ])' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9:;.,?!()"\s]{0,50}$/, { message: 'Invalid Swish message format' })
  message?: string;
}
