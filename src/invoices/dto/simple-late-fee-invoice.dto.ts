import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { LateFeeInvoice } from '../late-fee-invoice.model';

export class SimpleLateFeeInvoiceDTO {
  @ApiProperty({ description: 'Invoice id' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Invoice amount to pay' })
  @IsNumber()
  amount: number;

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

  @ApiProperty({ description: 'Method of payment' })
  @IsString()
  paidWith: string;

  @ApiProperty({ description: 'Due date' })
  @IsDate()
  dueDate: Date;

  @ApiProperty({ description: 'Has Discount' })
  @IsNumber()
  @IsOptional()
  hasDiscount?: number;

  static fromModel(lateFeeInvoice: LateFeeInvoice): SimpleLateFeeInvoiceDTO {
    const {
      id,
      amount,
      isPaid,
      paidWith,
      dueDate,
      isAccepted,
      hasDiscount,
    } = lateFeeInvoice;

    return {
      id,
      amount,
      isPaid,
      paidWith,
      dueDate,
      isAccepted,
      hasDiscount,
    };
  }
}
