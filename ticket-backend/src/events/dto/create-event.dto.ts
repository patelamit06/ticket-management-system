import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: 'Summer Music Festival 2026' })
  @IsString()
  @MinLength(1, { message: 'Event name is required' })
  @MaxLength(300)
  name: string;

  @ApiPropertyOptional({ example: 'Join us for a day of live music and food.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Central Park, New York' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiProperty({ example: '2026-07-15T18:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-07-15T23:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'US', description: 'Country ISO code for filtering' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  country?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  city?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;
}
