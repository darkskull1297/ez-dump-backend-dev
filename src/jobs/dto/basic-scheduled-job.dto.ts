import {
  IsArray,
  ValidateNested,
  IsInstance,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SimpleJobDTO } from './simple-job.dto';
import { ScheduledJob } from '../scheduled-job.model';
import { JobAssignationDTO } from './job-assignation.dto';
import { ContractorCompanyDTO } from '../../company/dto/contractor-company.dto';
import { ContractorCompany } from '../../company/contractor-company.model';
import { AreTruckCategoriesUnique } from '../validators/unique-truck-categories.validator';
import { TruckCategoryDTO } from './truck-category.dto';

export class BasicScheduledJobDTO {
  @ApiProperty({ description: 'Id' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Job', type: SimpleJobDTO })
  @IsInstance(SimpleJobDTO)
  @ValidateNested()
  job: SimpleJobDTO;

  @ApiProperty({ description: 'Job assignations', type: [JobAssignationDTO] })
  @Type(() => JobAssignationDTO)
  @IsArray()
  @ValidateNested({ each: true })
  assignations: JobAssignationDTO[];

  @ApiPropertyOptional({
    description: 'Job contractor company',
  })
  @IsOptional()
  @Type(() => ContractorCompanyDTO)
  @IsArray()
  @ValidateNested()
  contractorCompany?: ContractorCompanyDTO;

  @ApiProperty({
    description: "Job's truck classifications",
    type: [TruckCategoryDTO],
  })
  @IsOptional()
  @Type(() => TruckCategoryDTO)
  @IsArray()
  @ValidateNested({ each: true })
  @AreTruckCategoriesUnique()
  truckCategories: TruckCategoryDTO[];

  @ApiPropertyOptional({ description: 'Company Name' })
  companyName?: string;

  @ApiPropertyOptional({ description: 'Canceled at (only returned)' })
  canceledAt?: Date;

  @ApiPropertyOptional({ description: 'Canceled by owner (only returned)' })
  canceledByOwner?: boolean;

  @ApiPropertyOptional({ description: 'Earnings (only returned)' })
  earnings?: number;

  @ApiPropertyOptional({ description: 'Is invoice paid' })
  @IsOptional()
  isPaid?: boolean;

  static fromModel(scheduledJob: ScheduledJob): BasicScheduledJobDTO {
    const {
      job,
      assignations,
      id,
      canceledAt,
      canceledByOwner,
      company,
    } = scheduledJob;

    return {
      id,
      job: SimpleJobDTO.fromModel(job),
      companyName: company?.companyCommon?.name || '',
      assignations: assignations.map(assignation => {
        if (assignation.category) {
          return JobAssignationDTO.fromModel(assignation);
        }
        return JobAssignationDTO.fromModelWithoutCategory(
          assignation.driver,
          assignation.truck,
        );
      }),
      truckCategories: TruckCategoryDTO.fromArrayModel(job.truckCategories),
      canceledAt,
      canceledByOwner,
    };
  }

  static fromModelWithEarnings(
    scheduledJob: ScheduledJob,
    earnings: number,
  ): BasicScheduledJobDTO {
    const { job, assignations, id, canceledAt, canceledByOwner } = scheduledJob;
    return {
      id,
      job: SimpleJobDTO.fromModel(job),
      assignations: assignations.map(assignation => {
        if (assignation.category) {
          return JobAssignationDTO.fromModel(assignation);
        }
        return JobAssignationDTO.fromModelWithoutCategory(
          assignation.driver,
          assignation.truck,
        );
      }),
      truckCategories: TruckCategoryDTO.fromArrayModel(job.truckCategories),
      canceledAt,
      canceledByOwner,
      earnings,
    };
  }

  static async fromModelWithCompany(
    scheduledJob: ScheduledJob,
    contractorCompany: ContractorCompany,
    truckCategories: any = [],
    isPaid?: boolean,
  ): Promise<BasicScheduledJobDTO> {
    const { job, assignations, id, canceledAt, canceledByOwner } = scheduledJob;

    return {
      id,
      job: SimpleJobDTO.fromModel(job),
      assignations: assignations.map(assignation => {
        if (assignation.category) {
          return JobAssignationDTO.fromModel(assignation);
        }
        return JobAssignationDTO.fromModelWithoutCategory(
          assignation.driver,
          assignation.truck,
        );
      }),
      contractorCompany: await ContractorCompanyDTO.fromModel(
        contractorCompany,
      ),
      truckCategories: TruckCategoryDTO.fromArrayModel(truckCategories),
      canceledAt,
      canceledByOwner,
      isPaid,
    };
  }
}
