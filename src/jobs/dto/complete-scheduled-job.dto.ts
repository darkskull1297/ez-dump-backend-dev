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
import { JobDTO } from './job.dto';
import { OwnerCompanyDTO } from '../../company/dto/owner-company.dto';
import { TimeEntry } from '../../timer/time-entry.model';
import { TimeEntryDTO } from '../../timer/dto/time-entry.dto';
import { TimeEntryWithDriverDTO } from '../../timer/dto/time-entry-width-driver.dto';

export class CompleteScheduledJobDTO {
  @ApiProperty({ description: 'Id' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Job', type: JobDTO })
  @IsInstance(JobDTO)
  @ValidateNested()
  job: JobDTO;

  @ApiPropertyOptional({
    description: 'Owner contractor company',
  })
  @IsOptional()
  @Type(() => OwnerCompanyDTO)
  @IsArray()
  @ValidateNested()
  ownerCompany?: OwnerCompanyDTO;

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

  @ApiPropertyOptional({ description: 'Canceled at (only returned)' })
  canceledAt?: Date;

  @ApiPropertyOptional({ description: 'Canceled by owner (only returned)' })
  canceledByOwner?: boolean;

  @ApiPropertyOptional({ description: 'Earnings (only returned)' })
  @IsOptional()
  earnings?: number;

  @ApiPropertyOptional({
    description: 'Time entries',
    type: [TimeEntryWithDriverDTO],
  })
  @Type(() => TimeEntryWithDriverDTO)
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  timeEntries?: TimeEntryWithDriverDTO[];

  static fromModel(scheduledJob: ScheduledJob): CompleteScheduledJobDTO {
    const { job, assignations, id, canceledAt, canceledByOwner } = scheduledJob;
    return {
      id,
      job: JobDTO.fromModel(job),
      assignations: assignations.map(assignation => {
        if (assignation.category) {
          return JobAssignationDTO.fromModel(assignation);
        }
        return JobAssignationDTO.fromModelWithoutCategory(
          assignation.driver,
          assignation.truck,
        );
      }),
      canceledAt,
      canceledByOwner,
    };
  }

  static async fromModelWithCompanyAndEarnings(
    scheduledJob: ScheduledJob,
    contractorCompany: ContractorCompany,
    earnings: number,
  ): Promise<CompleteScheduledJobDTO> {
    const { job, assignations, id, canceledAt, canceledByOwner } = scheduledJob;
    return {
      id,
      job: JobDTO.fromModel(job),
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
      canceledAt,
      canceledByOwner,
      earnings,
    };
  }

  static async fromModelWithCompany(
    scheduledJob: ScheduledJob,
    contractorCompany: ContractorCompany,
  ): Promise<CompleteScheduledJobDTO> {
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
      job: JobDTO.fromModel(job),
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
      canceledAt,
      canceledByOwner,
      ownerCompany: OwnerCompanyDTO.fromModel(company),
    };
  }

  static async fromModelWithCompanyAndTimeEntries(
    scheduledJob: ScheduledJob,
    contractorCompany: ContractorCompany,
    timeEntries: TimeEntry[],
  ): Promise<CompleteScheduledJobDTO> {
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
      job: JobDTO.fromModel(job),
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
      canceledAt,
      canceledByOwner,
      ownerCompany: OwnerCompanyDTO.fromModel(company),
      timeEntries: TimeEntryWithDriverDTO.fromModels(timeEntries),
    };
  }
}
