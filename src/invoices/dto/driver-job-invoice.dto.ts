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

export class DriverJobInvoiceDTO {
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
  travelTime?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Previous Dispute for ticket',
  })
  @IsOptional()
  previousDisputeInvoice?: DisputeInvoiceDTO;

  @ApiPropertyOptional()
  @IsOptional()
  finishedBy?: any;

  @ApiProperty()
  isPaid: boolean;

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

  static fromModel(jobInvoice: DriverJobInvoice): DriverJobInvoiceDTO {
    const {
      id,
      amount,
      hours,
      sumLoad,
      sumTons,
      driver,
      timeEntries,
      truck,
      category,
      ticketNumber,
      disputeInvoice,
      isAcceptedByContractor,
      isAcceptedByOwner,
      evidenceImgs,
      comment,
      totalTravels,
      signatureImg,
      jobOrderNumber,
      travelTime,
      ticketEntries,
      supervisorName,
      supervisorComment,
      travelTimeSupervisor,
      previousDisputeInvoice,
      isPaid,
    } = jobInvoice;

    const validateTravelTime = (travelTime || '00:00').split(':');
    const travelTimeMinutes = Number(validateTravelTime[1]);
    const travelTimeHours =
      Number(validateTravelTime[0]) +
      Math.floor(Number(travelTimeMinutes) / 60);
    const resultingTravelTime = travelTimeHours + travelTimeMinutes / 60;

    const travelTimeInHours = resultingTravelTime / 60;
    const sumTravelAndHours = travelTimeInHours + hours;
    const totalAmount = sumTravelAndHours * driver.pricePerHour;

    return {
      id,
      amount,
      driverAmount: totalAmount,
      hours,
      sumLoad,
      sumTons,
      driver: SimpleDriverDTO.fromModel(driver),
      timeEntries: TimeEntryDTO.fromModels(timeEntries),
      truck: TruckDTO.fromModel(truck),
      category: TruckCategoryDTO.fromModel(category),
      ticketNumber: `${String(jobOrderNumber).padStart(3, '0')}-${String(
        ticketNumber,
      ).padStart(3, '0')}`,
      disputeInvoice: disputeInvoice
        ? DisputeInvoiceDTO.fromModel(disputeInvoice)
        : null,
      isAcceptedByContractor,
      isAcceptedByOwner,
      evidenceImgs,
      comment,
      totalTravels,
      signatureImg,
      travelTime,
      ticketEntries,
      isPaid,
      supervisorName,
      supervisorComment,
      travelTimeSupervisor,
      previousDisputeInvoice: previousDisputeInvoice
        ? DisputeInvoiceDTO.fromModel(previousDisputeInvoice)
        : null,
    };
  }

  static fromTicketModel(jobInvoice: DriverJobInvoice): DriverJobInvoiceDTO {
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
      isPaid,
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
      isPaid,
    };
  }
}
