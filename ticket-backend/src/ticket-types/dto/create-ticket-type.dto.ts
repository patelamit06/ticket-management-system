import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketTypeDto {
  @ApiProperty({ example: 'Adult' })
  @IsString()
  name: string;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  maxPerOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  availabilityStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  availabilityEnd?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  @Type(() => Number)
  ageMin?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  @Type(() => Number)
  ageMax?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}
