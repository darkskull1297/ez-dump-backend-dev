import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DisputeDTO {
  @ApiPropertyOptional({ description: 'Dispute message' })
  @IsOptional()
  @IsString()
  message: string;
}
