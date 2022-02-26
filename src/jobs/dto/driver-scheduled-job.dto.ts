import { IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { SimpleJobDTO } from './simple-job.dto';
import { ScheduledJob } from '../scheduled-job.model';
import { DriverJobAssignationDTO } from './driver-job-assignation.dto';
import { OwnerCompany } from '../../company/owner-company.model';

export class DriverScheduledJobDTO {
  @ApiProperty({ description: 'Job', type: SimpleJobDTO })
  @Type(() => SimpleJobDTO)
  @ValidateNested()
  job: SimpleJobDTO;

  @ApiProperty({
    description: 'Job assignations',
    type: DriverJobAssignationDTO,
  })
  @Type(() => DriverJobAssignationDTO)
  @ValidateNested()
  assignation: DriverJobAssignationDTO;

  @ApiPropertyOptional({ description: 'Load transported' })
  @IsOptional()
  company?: OwnerCompany;

  static fromModel(scheduledJob: ScheduledJob): DriverScheduledJobDTO {
    const { job, assignations, company } = scheduledJob;
    const [assignation] = assignations;

    return {
      job: SimpleJobDTO.fromModel(job),
      assignation: DriverJobAssignationDTO.fromModel(assignation),
      company,
    };
  }

  static fromModelWithAssignationDates(
    scheduledJob: ScheduledJob,
  ): DriverScheduledJobDTO {
    const { job, assignations, company } = scheduledJob;
    const [assignation] = assignations;

    return {
      job: SimpleJobDTO.fromModel(job),
      assignation: DriverJobAssignationDTO.fromModelWithDates(assignation),
      company,
    };
  }
}
