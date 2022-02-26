import {
  IsArray,
  IsEnum,
  IsInstance,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Bill } from '../bill.model';
import { GeneralJob } from '../../general-jobs/general-job.model';
import { DriverJobInvoice } from '../../invoices/driver-job-invoice.model';
import { Customer } from '../../customer/customer.model';
import { User } from '../../user/user.model';
import { BillStatus } from '../bill-status';

export class BillDto {
  @ApiPropertyOptional({ description: "User's id", readOnly: true })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: "Bill's contact" })
  @IsOptional()
  customer: Customer;

  @ApiProperty({ description: "Bill's job" })
  @Type(() => GeneralJob)
  @IsOptional()
  generalJob: GeneralJob;

  @ApiPropertyOptional({ description: 'General job' })
  @IsOptional()
  @IsString()
  generalJobId?: string;

  @ApiPropertyOptional({ description: 'Bill number' })
  @IsOptional()
  @IsNumber()
  billNumber?: number;

  @ApiPropertyOptional({ description: 'Bill number' })
  @IsOptional()
  @IsString()
  @IsEnum(BillStatus)
  status: BillStatus;

  @ApiPropertyOptional({ description: 'Bill number' })
  @IsOptional()
  @IsString()
  dueDate: string;

  @ApiPropertyOptional({ description: "Bill's user" })
  @IsOptional()
  @Type(() => User)
  @IsInstance(User)
  contractor?: User;

  @ApiPropertyOptional({ description: "Bill's tickets" })
  @IsOptional()
  @IsArray()
  invoices?: string[];

  @ApiPropertyOptional({ description: "Bill's tickets" })
  @IsOptional()
  @Type(() => DriverJobInvoice)
  @IsArray()
  driverInvoices?: DriverJobInvoice[];

  toModel?(): BillDto {
    return {
      generalJob: this.generalJob,
      billNumber: this.billNumber,
      contractor: this.contractor,
      invoices: this.invoices,
      customer: this.customer,
      status: this.status,
      dueDate: this.dueDate,
    };
  }

  static fromModel(bill: Bill): BillDto {
    const {
      customer,
      id,
      driverInvoices,
      user,
      generalJob,
      billNumber,
      dueDate,
      status,
    } = bill;
    return {
      customer,
      id,
      driverInvoices,
      contractor: user,
      generalJob,
      billNumber,
      dueDate,
      status,
    };
  }
}
