import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Ticket type ID (CUID)' })
  @IsString()
  @IsNotEmpty()
  ticketTypeId!: string;

  @ApiProperty({ minimum: 1, description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Event ID (CUID)' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'Ticket type and quantity per line' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Guest email (required when not logged in)' })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiPropertyOptional({ description: 'Guest name (required when not logged in)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  guestName?: string;
}
