import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import Stripe from 'stripe';

export class StripeBankAccountDTO {
  @ApiPropertyOptional({ description: 'Country', default: 'US' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Currency', default: 'usd' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Account Holder Name' })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiPropertyOptional({ description: 'Account Holder Type' })
  @IsOptional()
  @IsString()
  accountHolderType?: string;

  @ApiPropertyOptional({ description: 'Routing Number' })
  @IsString()
  @IsOptional()
  routingNumber?: string;

  @ApiPropertyOptional({ description: 'Account Number' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Status', readOnly: true })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Status', readOnly: true })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Status', readOnly: true })
  @IsString()
  @IsOptional()
  id?: string;

  static fromModel(bankAccount: Stripe.BankAccount): StripeBankAccountDTO {
    const {
      id,
      bank_name: bankName,
      account_holder_name: accountHolderName,
      account_holder_type: accountHolderType,
      status,
      routing_number: routingNumber,
      last4,
    } = bankAccount;

    return {
      id,
      bankName,
      accountNumber: last4,
      accountHolderType,
      accountHolderName,
      status,
      routingNumber,
    };
  }
}
