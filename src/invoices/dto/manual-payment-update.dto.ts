import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import { PaymentMethod } from '../payment-method';

export class ManualPaymentUpdateDto {
  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paidWith: PaymentMethod;

  @ApiPropertyOptional({ description: 'Amount received' })
  @IsOptional()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Account number' })
  @IsOptional()
  @IsString()
  accountNumber: string;

  @ApiPropertyOptional({ description: 'Order number' })
  @IsOptional()
  orderNumber?: string;

  @ApiPropertyOptional({ description: 'Attachments' })
  @IsOptional()
  @IsString()
  attachments: string;

  @ApiPropertyOptional({ description: 'Memo' })
  @IsOptional()
  @IsString()
  memo: string;
}
