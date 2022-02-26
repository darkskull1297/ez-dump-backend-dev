import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ContractorInvoicesTotalsDTO {
  @ApiPropertyOptional({ description: 'Total paid' })
  @IsOptional()
  @IsNumber()
  totalPaid: number;

  @ApiPropertyOptional({ description: 'Total unpaid' })
  @IsOptional()
  @IsNumber()
  totalUnpaid: number;
}
