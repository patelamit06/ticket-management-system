import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsNumber, Min, Max, IsDateString, IsIn, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

const TYPES = ['early_bird', 'group'] as const;

export class CreateEventDiscountDto {
  @ApiProperty({ example: 'Early Bird' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['early_bird', 'group'] })
  @IsIn(TYPES)
  type: string;

  @ApiProperty({ example: 5, description: 'Discount percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercent: number;

  @ApiPropertyOptional({ description: 'early_bird: valid until this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({ example: 10, description: 'group: minimum quantity to get discount' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Ticket type IDs this discount applies to (empty = all)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ticketTypeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}
