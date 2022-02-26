import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class OwnerDriverTotalsDTO {
  @ApiPropertyOptional({ description: 'Total active drivers' })
  @IsOptional()
  @IsNumber()
  active: number;

  @ApiPropertyOptional({ description: 'Total inactive drivers' })
  @IsOptional()
  @IsNumber()
  inactive: number;

  @ApiPropertyOptional({ description: 'Total drivers' })
  @IsOptional()
  @IsNumber()
  total: number;
}
