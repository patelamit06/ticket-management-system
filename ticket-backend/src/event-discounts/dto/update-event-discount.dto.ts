import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsNumber, Min, Max, IsDateString, IsIn, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

const TYPES = ['early_bird', 'group'] as const;

export class UpdateEventDiscountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['early_bird', 'group'] })
  @IsOptional()
  @IsIn(TYPES)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minQuantity?: number;

  @ApiPropertyOptional()
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
