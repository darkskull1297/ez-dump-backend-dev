import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsDate,
  IsArray,
} from 'class-validator';
import { SimpleJobDTO } from '../../jobs/dto/simple-job.dto';
import { SimpleOwnerDTO } from '../../user/dto/simple-owner.dto';
import { OwnerJobInvoice } from '../owner-job-invoice.model';
import { DriverJobInvoiceDTO } from './driver-job-invoice.dto';
import { DisputeInvoiceDTO } from './dispute-invoice.dto';

export class OwnerJobInvoiceDTO {
  @ApiProperty({ description: 'Invoice id' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Invoice amount to pay' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Invoice net amount' })
  @IsNumber()
  netAmount: number;

  @ApiProperty({ description: 'Is invoice paid?' })
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty({ description: 'Historic array of invoice events' })
  @IsArray()
  eventsHistory: any[];

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

  @ApiPropertyOptional({ description: 'Order number (only returned)' })
  orderNumber?: string;

  @ApiProperty({ description: 'Driver invoices', type: [DriverJobInvoiceDTO] })
  @Type(() => DriverJobInvoiceDTO)
  @ValidateNested({ each: true })
  driverInvoices: DriverJobInvoiceDTO[];

  @ApiPropertyOptional({ description: 'Ticket Fullfield' })
  @IsOptional()
  @IsBoolean()
  ticketFullfield?: boolean;

  @ApiProperty({ description: 'Owner', type: SimpleOwnerDTO })
  @Type(() => SimpleOwnerDTO)
  @ValidateNested()
  owner: SimpleOwnerDTO;

  @ApiPropertyOptional({ description: 'Job', type: SimpleJobDTO })
  @IsOptional()
  @Type(() => SimpleJobDTO)
  @ValidateNested()
  job?: SimpleJobDTO;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Requested cash advance?' })
  @IsBoolean()
  @IsOptional()
  cashAdvanceRequest: boolean;

  @ApiPropertyOptional({ description: 'Cash advance request confirmed?' })
  @IsBoolean()
  @IsOptional()
  cashAdvanceConfirmed: boolean;

  @ApiPropertyOptional({ description: 'Cash advance accepted?' })
  @IsBoolean()
  @IsOptional()
  cashAdvanceAccepted: boolean;

  @ApiProperty({ description: 'Dispute Invoice', type: DisputeInvoiceDTO })
  @Type(() => DisputeInvoiceDTO)
  @ValidateNested()
  disputeInvoice?: DisputeInvoiceDTO;

  @ApiProperty({ description: 'Has Discount' })
  @IsNumber()
  @IsOptional()
  hasDiscount?: number;

  @ApiProperty({ description: 'Is Associated' })
  @IsBoolean()
  @IsOptional()
  isAssociatedInvoice?: boolean;

  @ApiProperty({ description: 'Date when invoice was paid' })
  @IsDate()
  paidAt: Date;

  @ApiProperty({ description: 'Date when invoice was rejected' })
  @IsDate()
  rejectedAt: Date;

  @ApiProperty({ description: 'Date when invoice was approved' })
  @IsDate()
  approvedAt: Date;

  @ApiProperty({ description: 'Method of payment' })
  @IsString()
  paidWith: string;

  @ApiProperty({ description: 'Invoice status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Account number' })
  @IsNumber()
  accountNumber: number;

  static fromModel(jobInvoice: OwnerJobInvoice): OwnerJobInvoiceDTO {
    const {
      id,
      amount,
      netAmount,
      isPaid,
      driverInvoices = [],
      owner,
      job,
      jobOrderNumber,
      ownerOrderNumber,
      dueDate,
      cashAdvanceRequest,
      cashAdvanceConfirmed,
      cashAdvanceAccepted,
      disputeInvoice,
      isAcceptedByContractor,
      isAcceptedByOwner,
      hasDiscount,
      isAssociatedInvoice,
      currDispute,
      paidAt,
      rejectedAt,
      approvedAt,
      paidWith,
      status,
      accountNumber,
      eventsHistory,
    } = jobInvoice || {};
    return {
      id,
      amount,
      netAmount,
      isPaid,
      isAcceptedByContractor,
      isAcceptedByOwner,
      hasDiscount,
      paidAt,
      rejectedAt,
      approvedAt,
      eventsHistory,
      driverInvoices: driverInvoices.map(driverInvoice =>
        DriverJobInvoiceDTO.fromModel(driverInvoice),
      ),
      ticketFullfield: driverInvoices.some(
        driverInvoice =>
          driverInvoice.signatureImg === null ||
          driverInvoice.signatureImg === '',
      ),
      owner: owner ? SimpleOwnerDTO.fromModel(owner) : null,
      job: job ? SimpleJobDTO.fromModel(job) : null,
      orderNumber: `${String(ownerOrderNumber).padStart(3, '0')}-${String(
        jobOrderNumber,
      ).padStart(3, '0')}${
        currDispute > 0 ? `-${String(currDispute).padStart(3, '0')}` : ''
      }`,
      dueDate,
      cashAdvanceRequest,
      cashAdvanceConfirmed,
      cashAdvanceAccepted,
      isAssociatedInvoice,
      disputeInvoice: disputeInvoice
        ? DisputeInvoiceDTO.fromModel(disputeInvoice)
        : null,
      paidWith,
      status,
      accountNumber,
    };
  }
}
