import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsDate,
  ValidateNested,
  IsOptional,
  IsBoolean,
} from 'class-validator';

import { LateFeeManualPayment } from '../late-fee-manual-payment.model';
import { SimpleLateFeeInvoiceDTO } from './simple-late-fee-invoice.dto';

export class LateFeeManualPaymentDTO {
  @ApiProperty({ description: 'Manual payment id' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Job invoice' })
  @ValidateNested()
  @Type(() => SimpleLateFeeInvoiceDTO)
  lateFeeInvoice: SimpleLateFeeInvoiceDTO;

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

  static fromModel(manualPayment: LateFeeManualPayment) {
    const {
      accountNumber,
      orderNumber,
      attachments,
      memo,
      paymentDate,
      id,
      lateFeeInvoice,
      rejectReason,
      rejected,
      rejectedAt,
    } = manualPayment;
    return {
      id,
      orderNumber,
      accountNumber,
      paymentDate,
      attachments,
      memo,
      lateFeeInvoice: SimpleLateFeeInvoiceDTO.fromModel(lateFeeInvoice),
      rejectReason,
      rejected,
      rejectedAt,
    };
  }
}
