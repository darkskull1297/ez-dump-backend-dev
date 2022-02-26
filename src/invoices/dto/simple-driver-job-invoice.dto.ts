import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsInstance } from 'class-validator';
import { DriverDTO } from '../../user/dto/driver-dto';
import { DriverJobInvoice } from '../driver-job-invoice.model';

export class SimpleDriverJobInvoiceDTO {
  @ApiProperty({ description: 'Invoice id' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Invoice amount to pay' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Hours worked' })
  @IsNumber()
  hours: number;

  @ApiPropertyOptional({ description: 'Total tons transported' })
  @IsOptional()
  @IsNumber()
  sumTons?: number;

  @ApiPropertyOptional({ description: 'Total load transported' })
  @IsOptional()
  @IsNumber()
  sumLoad?: number;

  @ApiPropertyOptional({ description: 'Travel time in minutes transported' })
  @IsOptional()
  @IsNumber()
  travelTime?: string;

  @ApiPropertyOptional({ description: 'Travel time Supervisor' })
  @IsOptional()
  @IsNumber()
  travelTimeSupervisor?: number;

  @ApiPropertyOptional({ description: 'Ticket number' })
  @IsOptional()
  @IsNumber()
  ticketNumber?: number;

  @ApiPropertyOptional({ description: 'Driver' })
  @IsOptional()
  driver?: DriverDTO;

  static fromModel(jobInvoice: DriverJobInvoice): SimpleDriverJobInvoiceDTO {
    const {
      id,
      amount,
      hours,
      sumLoad,
      sumTons,
      travelTime,
      ticketNumber,
      travelTimeSupervisor,
    } = jobInvoice;

    return {
      id,
      amount,
      hours,
      sumLoad,
      sumTons,
      travelTime,
      ticketNumber,
      travelTimeSupervisor,
    };
  }
}
