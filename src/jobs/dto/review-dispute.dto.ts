import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ReviewDisputeDTO {
  @ApiProperty({ description: 'Dispute confirmation' })
  @IsBoolean()
  confirm: boolean;
}
