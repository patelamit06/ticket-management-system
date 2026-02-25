import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsIn, MinLength, MaxLength } from 'class-validator';

const STATUSES = ['draft', 'pending_approval', 'published', 'cancelled'] as const;

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ enum: ['draft', 'pending_approval', 'published', 'cancelled'] })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;
}
