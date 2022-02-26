import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsArray } from 'class-validator';
import { Customer } from '../../customer/customer.model';
import { GeneralJob } from '../../general-jobs/general-job.model';
import { Truck } from '../../trucks/truck.model';

export class BillsTicketsFiltered {
  @ApiProperty({ description: 'Customers' })
  @Type(() => Customer)
  @IsArray()
  @IsOptional()
  customers: Customer[];

  @ApiProperty({ description: 'Projects' })
  @Type(() => GeneralJob)
  @IsArray()
  @IsOptional()
  projects: GeneralJob[];

  @ApiProperty({ description: 'Materials' })
  @IsArray()
  @IsOptional()
  materials: string[];

  @ApiProperty({ description: 'Trucks' })
  @Type(() => Truck)
  @IsArray()
  @IsOptional()
  trucks: Truck[];
}
