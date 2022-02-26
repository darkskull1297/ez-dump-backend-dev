import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ReviewCashAdvanceDTO {
  @ApiProperty({ description: 'Cash advance confirmation' })
  @IsBoolean()
  confirm: boolean;
}
