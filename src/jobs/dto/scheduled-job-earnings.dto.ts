import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ScheduledJobEarningsDTO {
  @ApiPropertyOptional({ description: 'Earnings' })
  @IsOptional()
  earnings: number;

  @ApiPropertyOptional({ description: 'Id' })
  @IsOptional()
  @IsString()
  id?: string;
}
