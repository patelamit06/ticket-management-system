import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] as const;

export class PresignedUploadDto {
  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type of the image to upload',
    enum: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  })
  @IsString()
  @IsIn(ALLOWED_TYPES)
  contentType: string;
}
