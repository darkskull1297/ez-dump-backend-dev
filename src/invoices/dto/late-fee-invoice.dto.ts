/* eslint-disable no-return-await */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractorDTO } from '../../user/dto/contractor-dto';
import { LateFeeInvoice } from '../late-fee-invoice.model';
import { JobInvoiceDTO } from './job-invoice.dto';

export class LateFeeInvoiceDTO {
  @ApiProperty({ description: 'Due date' })
  @IsDate()
  dueDate: Date;

  @ApiProperty({ description: 'Invoice id' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Created date' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({
    description:
      'The date when the payment was done, if it was not yet unpaid it will be null',
  })
  @IsDate()
  paidAt: Date;

  @ApiProperty({ description: 'Amount to pay' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Late fee invoice order Number' })
  @IsString()
  orderNumber: string;

  @ApiProperty({ description: 'Method of payment' })
  @IsString()
  paidWith: string;

  @ApiProperty({ description: 'Invoice status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Is invoice paid?' })
  @IsBoolean()
  isPaid: boolean;

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

  @ApiProperty({
    description: 'Job Invoice',
    type: JobInvoiceDTO,
    readOnly: true,
  })
  @Type(() => JobInvoiceDTO)
  jobInvoice?: JobInvoiceDTO;

  static async fromModel(
    lateFeeInvoice: LateFeeInvoice,
  ): Promise<LateFeeInvoiceDTO> {
    const {
      amount,
      orderNumber,
      contractor,
      createdAt,
      updatedAt,
      jobInvoice,
      paidAt,
      paidWith,
      status,
      isPaid,
      id,
      dueDate,
      hasDiscount,
    } = lateFeeInvoice;
    return {
      dueDate,
      createdAt,
      updatedAt,
      paidAt,
      amount,
      orderNumber,
      paidWith,
      status,
      contractor: contractor ? await ContractorDTO.fromModel(contractor) : null,
      jobInvoice: jobInvoice ? await JobInvoiceDTO.fromModel(jobInvoice) : null,
      isPaid,
      id,
      hasDiscount,
    };
  }

  static async fromModels(
    lateFeeInvoices: LateFeeInvoice[],
  ): Promise<LateFeeInvoiceDTO[]> {
    return await Promise.all(
      lateFeeInvoices.map(async lateFeeInvoice =>
        LateFeeInvoiceDTO.fromModel(lateFeeInvoice),
      ),
    );
  }
}
