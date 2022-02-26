import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class TruckTotalsDTO {
  @ApiPropertyOptional({ description: 'Total active trucks' })
  @IsOptional()
  @IsNumber()
  active: number;

  @ApiPropertyOptional({ description: 'Total inactive trucks' })
  @IsOptional()
  @IsNumber()
  inactive: number;

  @ApiPropertyOptional({ description: 'Total trucks' })
  @IsOptional()
  @IsNumber()
  total: number;
}
