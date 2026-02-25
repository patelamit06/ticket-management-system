import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '+919876543210', description: 'Phone with country code (e.g. +91 for India)' })
  @IsString()
  @MinLength(10, { message: 'Phone number with country code is required (e.g. +919876543210)' })
  @MaxLength(20)
  @Matches(/^\+[\d\s-]+$/, { message: 'Phone must start with + and contain only digits, spaces, or hyphens' })
  phone: string;

  @ApiProperty({ example: 'SecureP@ss1', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}
