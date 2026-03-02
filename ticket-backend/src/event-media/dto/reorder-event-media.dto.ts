import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReorderEventMediaDto {
  @ApiProperty({ type: [String], description: 'Ordered list of event media IDs' })
  @IsArray()
  @IsString({ each: true })
  mediaIds: string[];
}
