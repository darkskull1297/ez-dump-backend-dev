import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsDate,
  ValidateNested,
  IsOptional,
  IsBoolean,
} from 'class-validator';

import { ManualPayment } from '../manual-payment.model';
import { SimpleJobInvoiceDTO } from './simple-job-invoice.dto';

export class ManualPaymentDTO {
  @ApiProperty({ description: 'Manual payment id' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Date when the payment was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Job invoice' })
  @ValidateNested()
  @Type(() => SimpleJobInvoiceDTO)
  jobInvoice: SimpleJobInvoiceDTO;

  @ApiPropertyOptional({ description: 'Payment date' })
  @IsDate()
  @IsOptional()
  paymentDate?: Date;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Order number' })
  @IsString()
  orderNumber: string;

  @ApiPropertyOptional({ description: 'Attachments' })
  @IsOptional()
  @IsString()
  attachments?: string;

  @ApiPropertyOptional({ description: 'Memo' })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional({ description: 'Reason why the payment was rejected!' })
  @IsOptional()
  @IsString()
  rejectReason?: string;

  @ApiProperty({ description: 'Is the payment rejected? ' })
  @IsOptional()
  @IsBoolean()
  rejected: boolean;

  @ApiProperty({ description: 'Date when the payment was rejected' })
  @IsOptional()
  rejectedAt?: Date;

  static fromModel(manualPayment: ManualPayment) {
    const {
      accountNumber,
      orderNumber,
      attachments,
      memo,
      paymentDate,
      id,
      createdAt,
      jobInvoice,
      rejectReason,
      rejected,
      rejectedAt,
    } = manualPayment;
    return {
      id,
      createdAt,
      orderNumber,
      accountNumber,
      paymentDate,
      attachments,
      memo,
      jobInvoice: SimpleJobInvoiceDTO.fromModel(jobInvoice),
      rejectReason,
      rejected,
      rejectedAt,
    };
  }
}
