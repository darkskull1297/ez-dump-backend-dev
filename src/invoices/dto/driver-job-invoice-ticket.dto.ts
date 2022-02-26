import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { TimeEntryDTO } from '../../timer/dto/time-entry.dto';
import { TruckDTO } from '../../trucks/dto/truck.dto';
import { SimpleDriverDTO } from '../../user/dto/simple-driver-dto';
import { DriverJobInvoice } from '../driver-job-invoice.model';
import { TruckCategoryDTO } from '../../jobs/dto/truck-category.dto';
import { DisputeInvoiceDTO } from './dispute-invoice.dto';
import { SimpleJobDTO } from '../../jobs/dto/simple-job.dto';

export class DriverJobInvoiceTicketDTO {
  @ApiProperty({ description: 'Invoice id' })
  @IsString()
  id: string;

  @ApiPropertyOptional({
    description: 'Is accepted by owner?',
    nullable: true,
    readOnly: true,
  })
  @IsOptional()
  @IsBoolean()
  isAcceptedByOwner?: boolean;

  @ApiPropertyOptional({
    description: 'Is accepted by contractor?',
    nullable: true,
    readOnly: true,
  })
  @IsOptional()
  @IsBoolean()
  isAcceptedByContractor?: boolean;

  @ApiProperty({ description: 'Invoice amount to pay' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Driver amount' })
  @IsOptional()
  @IsNumber()
  driverAmount?: number;

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

  @ApiProperty({ description: 'Driver', type: SimpleDriverDTO })
  @Type(() => SimpleDriverDTO)
  @ValidateNested()
  driver?: SimpleDriverDTO;

  @ApiProperty({ description: 'Truck', type: TruckDTO })
  @Type(() => TruckDTO)
  @ValidateNested()
  truck: TruckDTO;

  @ApiProperty({ description: 'Category', type: TruckCategoryDTO })
  @Type(() => TruckCategoryDTO)
  @ValidateNested()
  category?: TruckCategoryDTO;

  @ApiProperty({
    description: 'Driver time entries for job',
    type: [TimeEntryDTO],
  })
  @Type(() => TimeEntryDTO)
  @ValidateNested({ each: true })
  timeEntries: TimeEntryDTO[];

  @ApiPropertyOptional({
    description: "Driver job's invoice ticket number (only returned)",
  })
  ticketNumber?: string;

  @ApiProperty({ description: 'Dispute Invoice', type: DisputeInvoiceDTO })
  @Type(() => DisputeInvoiceDTO)
  @ValidateNested()
  disputeInvoice?: DisputeInvoiceDTO;

  @ApiPropertyOptional({ description: 'Comment', readOnly: true })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Total travels', readOnly: true })
  @IsOptional()
  @IsNumber()
  totalTravels?: number;

  @ApiPropertyOptional({ description: 'signature image', readOnly: true })
  @IsOptional()
  @IsString()
  signatureImg?: string;

  @ApiPropertyOptional({ description: 'evidence images', readOnly: true })
  @IsOptional()
  @IsArray()
  evidenceImgs?: string[];

  @ApiPropertyOptional({ type: 'real', nullable: true })
  @IsOptional()
  @IsNumber()
  travelTimeInMinutes?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  finishedBy?: any;

  @ApiPropertyOptional()
  @IsOptional()
  ticketEntries?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  supervisorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  supervisorComment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  travelTimeSupervisor?: number;

  @ApiPropertyOptional({ description: 'Job', type: SimpleJobDTO })
  @IsOptional()
  @Type(() => SimpleJobDTO)
  @ValidateNested()
  job?: SimpleJobDTO;

  static fromModel(jobInvoice: DriverJobInvoice): DriverJobInvoiceTicketDTO {
    const {
      id,
      amount,
      hours,
      sumLoad,
      sumTons,
      timeEntries,
      truck,
      ticketNumber,
      disputeInvoice,
      isAcceptedByContractor,
      isAcceptedByOwner,
      jobOrderNumber,
      ticketEntries,
      job,
    } = jobInvoice;

    return {
      id,
      amount,
      hours,
      sumLoad,
      sumTons,
      timeEntries: TimeEntryDTO.fromModels(timeEntries),
      truck: TruckDTO.fromModel(truck),
      ticketNumber: `${String(jobOrderNumber).padStart(3, '0')}-${String(
        ticketNumber,
      ).padStart(3, '0')}`,
      disputeInvoice: disputeInvoice
        ? DisputeInvoiceDTO.fromModel(disputeInvoice)
        : null,
      isAcceptedByContractor,
      isAcceptedByOwner,
      ticketEntries,
      job: job ? SimpleJobDTO.fromModel(job) : null,
    };
  }
}
