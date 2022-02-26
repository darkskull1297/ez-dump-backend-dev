import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsDate,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';
import { SimpleJobDTO } from '../../jobs/dto/simple-job.dto';
import { JobInvoice } from '../job-invoice.model';
import { LateFeeInvoiceDTO } from './late-fee-invoice.dto';

import { OwnerJobInvoiceDTO } from './owner-job-invoice.dto';
import { ContractorDTO } from '../../user/dto/contractor-dto';

export class JobInvoiceDTO {
  @ApiProperty({ description: 'Invoice id' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Invoice amount to pay' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Historic array of invoice events' })
  @IsArray()
  eventsHistory: any[];

  @ApiPropertyOptional({
    description: 'Is accepted by contractor?',
    nullable: true,
    readOnly: true,
  })
  @IsOptional()
  @IsBoolean()
  isAccepted: boolean;

  @ApiProperty({ description: 'Is invoice paid?' })
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty({ description: 'Invoice status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Method of payment' })
  @IsString()
  paidWith: string;

  @ApiProperty({ description: 'Due date' })
  @IsDate()
  dueDate: Date;

  @ApiProperty({ description: 'Date when invoice was paid' })
  @IsDate()
  paidAt: Date;

  @ApiProperty({ description: 'Date when invoice was rejected' })
  @IsDate()
  rejectedAt: Date;

  @ApiProperty({ description: 'Date when invoice was approved' })
  @IsDate()
  approvedAt: Date;

  @ApiPropertyOptional({ description: 'Order number (only returned)' })
  orderNumber?: string;

  @ApiPropertyOptional({ description: 'Order number (only returned)' })
  baseOrderNumber?: string;

  @ApiProperty({ description: 'Owner invoices', type: [OwnerJobInvoiceDTO] })
  @Type(() => OwnerJobInvoiceDTO)
  @ValidateNested({ each: true })
  ownerInvoices: OwnerJobInvoiceDTO[];

  @ApiProperty({ description: 'Job', type: SimpleJobDTO })
  @Type(() => SimpleJobDTO)
  @ValidateNested()
  job: SimpleJobDTO;

  @ApiProperty({
    description: 'Contractor',
    type: ContractorDTO,
    readOnly: true,
  })
  @Type(() => ContractorDTO)
  contractor?: ContractorDTO;

  @ApiProperty({ description: 'Has Discount' })
  @IsNumber()
  @IsOptional()
  hasDiscount?: number;

  static async fromModel(jobInvoice: JobInvoice): Promise<JobInvoiceDTO> {
    const {
      id,
      amount,
      isPaid,
      status,
      paidWith,
      orderNumber,
      dueDate,
      ownerInvoices,
      job,
      isAccepted,
      contractor,
      contractorOrderNumber,
      hasDiscount,
      currDispute,
      paidAt,
      rejectedAt,
      approvedAt,
      eventsHistory,
    } = jobInvoice;

    return {
      id,
      amount,
      isPaid,
      status,
      paidWith,
      paidAt,
      rejectedAt,
      approvedAt,
      eventsHistory,
      baseOrderNumber: `${String(contractorOrderNumber).padStart(
        3,
        '0',
      )}-${String(orderNumber).padStart(3, '0')}`,
      orderNumber: `${String(contractorOrderNumber).padStart(3, '0')}-${String(
        orderNumber,
      ).padStart(3, '0')}${
        currDispute > 0 ? `-${String(currDispute).padStart(3, '0')}` : ''
      }`,
      dueDate,
      isAccepted,
      hasDiscount,
      ownerInvoices: ownerInvoices
        ? ownerInvoices.map(ownerInvoice =>
          OwnerJobInvoiceDTO.fromModel(ownerInvoice),
        )
        : null,
      job: SimpleJobDTO.fromModel(job),
      contractor: contractor ? await ContractorDTO.fromModel(contractor) : null,
    };
  }
}
