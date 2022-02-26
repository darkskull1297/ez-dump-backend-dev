import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { JobInvoice } from '../job-invoice.model';

export class SimpleJobInvoiceDTO {
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

  @ApiProperty({ description: 'Paid At date' })
  @IsDate()
  paidAt: Date;

  @ApiProperty({ description: 'Approved At date' })
  @IsDate()
  approvedAt: Date;

  @ApiProperty({ description: 'Due date' })
  @IsDate()
  dueDate: Date;

  @ApiProperty({ description: 'Has Discount' })
  @IsNumber()
  @IsOptional()
  hasDiscount?: number;

  static fromModel(jobInvoice: JobInvoice): SimpleJobInvoiceDTO {
    const {
      id,
      amount,
      isPaid,
      paidWith,
      paidAt,
      approvedAt,
      dueDate,
      isAccepted,
      hasDiscount,
    } = jobInvoice;

    return {
      id,
      amount,
      isPaid,
      paidWith,
      paidAt,
      approvedAt,
      dueDate,
      isAccepted,
      hasDiscount,
    };
  }
}
