import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class OwnerInvoicesTotalsDTO {
  @ApiPropertyOptional({ description: 'Total profits' })
  @IsOptional()
  @IsNumber()
  totalProfits: number;

  @ApiPropertyOptional({ description: 'Total unpaid profits' })
  @IsOptional()
  @IsNumber()
  unpaidProfits: number;

  @ApiPropertyOptional({ description: 'Total paid to drivers' })
  @IsOptional()
  @IsNumber()
  paidToDrivers: number;

  @ApiPropertyOptional({ description: 'Total unpaid to drviers' })
  @IsOptional()
  @IsNumber()
  unpaidToDrivers: number;
}
