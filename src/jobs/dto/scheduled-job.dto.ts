import { IsArray, ValidateNested, IsInstance } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { JobDTO } from './job.dto';
import { ScheduledJob } from '../scheduled-job.model';
import { JobAssignationDTO } from './job-assignation.dto';

export class ScheduledJobDTO {
  @ApiProperty({ description: 'Job', type: JobDTO })
  @IsInstance(JobDTO)
  @ValidateNested()
  job: JobDTO;

  @ApiProperty({ description: 'Job assignations', type: [JobAssignationDTO] })
  @Type(() => JobAssignationDTO)
  @IsArray()
  @ValidateNested({ each: true })
  assignations: JobAssignationDTO[];

  @ApiPropertyOptional({ description: 'Canceled at' })
  canceledAt?: Date;

  @ApiPropertyOptional({ description: 'Paid at' })
  paidAt?: Date;

  @ApiProperty({ description: 'Payment due' })
  paymentDue?: Date;

  static fromModel(scheduledJob: ScheduledJob): ScheduledJobDTO {
    const { job, assignations, canceledAt, paidAt, paymentDue } = scheduledJob;
    return {
      canceledAt,
      paidAt,
      paymentDue,
      job: JobDTO.fromModel(job),
      assignations: assignations.map(assignation =>
        JobAssignationDTO.fromModel(assignation),
      ),
    };
  }
}
