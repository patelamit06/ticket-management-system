import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, MaxLength, IsIn, ValidateIf } from 'class-validator';

export class CreateEventMediaDto {
  @ApiProperty({ example: 'video', description: 'image | video' })
  @IsString()
  @IsIn(['image', 'video'])
  type: 'image' | 'video';

  @ApiPropertyOptional({ description: 'Required for video: YouTube or other embed/watch URL' })
  @ValidateIf((o) => o.type === 'video')
  @IsString()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ description: 'Required for image: object key returned from presigned-upload' })
  @ValidateIf((o) => o.type === 'image')
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
