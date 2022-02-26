import {
  IsString,
  IsOptional,
  ValidateNested,
  IsInstance,
  IsNumber,
  IsArray,
  IsDate,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LocationDTO } from '../../jobs/dto/location.dto';
import { JobInvoice } from '../../invoices/job-invoice.model';
import { JobInvoiceDTO } from '../../invoices/dto/job-invoice.dto';
import { ContractorDTO } from '../../user/dto/contractor-dto';
import { MaterialDTO } from './material.dto';
import { GeneralJob } from '../general-job.model';
import { Material } from '../material.model';
import { GeneralJobStatus } from '../general-job-status';
import { CustomerDto } from '../../customer/dto/customer.dto';

import { Customer } from '../../customer/customer.model';

export class GeneralJobDto {
  @ApiPropertyOptional({ description: "Job category's id", readOnly: true })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: "Job category's name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Job terms' })
  @IsOptional()
  @IsNumber()
  terms?: number;

  @ApiPropertyOptional({ description: "Job's status", enum: GeneralJobStatus })
  @IsOptional()
  @IsEnum(GeneralJobStatus)
  status?: GeneralJobStatus;

  @ApiPropertyOptional({ description: 'Job number', readOnly: true })
  @IsOptional()
  @IsNumber()
  jobNumber?: number;

  @ApiProperty({ description: "Job's start date" })
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({ description: "Job's contractor", readOnly: true })
  @Type(() => ContractorDTO)
  user?: ContractorDTO;

  @ApiProperty({ description: "Job's category budget" })
  @IsNumber()
  budget: number;

  @ApiProperty({ description: "Job category's address" })
  @Type(() => LocationDTO)
  @ValidateNested()
  @IsInstance(LocationDTO)
  address?: LocationDTO;

  @ApiPropertyOptional({
    description: "General job shift's invoices",
    readOnly: true,
  })
  @IsOptional()
  @Type(() => JobInvoiceDTO)
  @IsInstance(JobInvoiceDTO)
  invoices?: JobInvoice[];

  @ApiPropertyOptional({
    description: 'General job available shifts',
    readOnly: true,
  })
  @IsOptional()
  @IsNumber()
  availableShifts?: number;

  @ApiPropertyOptional({ description: 'Materials', type: [MaterialDTO] })
  @IsOptional()
  @Type(() => MaterialDTO)
  @IsArray()
  @ValidateNested({ each: true })
  materials?: MaterialDTO[];

  @ApiPropertyOptional({
    description: 'Foremans',
  })
  @IsOptional()
  foremans?: string[];

  @ApiPropertyOptional({ description: 'Materials', type: [MaterialDTO] })
  @IsOptional()
  customer?: Customer;

  static fromModel(generalJob: any): GeneralJobDto {
    const {
      id,
      status,
      name,
      user,
      budget,
      address,
      invoices,
      materials,
      startDate,
      terms,
      customer,
      foremans,
    } = generalJob;

    return {
      id,
      name,
      user,
      budget,
      address: LocationDTO.fromModel(address),
      invoices,
      materials:
        materials?.map(material => MaterialDTO.fromModel(material)) || [],
      startDate,
      terms,
      status,
      customer,
      foremans,
    };
  }

  toModel?(): Omit<GeneralJob, 'id' | 'createdAt' | 'updatedAt' | 'user'> {
    const {
      name,
      status,
      budget,
      address,
      materials,
      startDate,
      terms,
      customer,
    } = this;

    return {
      name,
      budget,
      address: address.toModel(),
      materials: materials?.map(material => material.toModel()) as Material[],
      startDate,
      terms,
      status,
      customer,
    };
  }
}
