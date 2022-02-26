import { PartialType } from '@nestjs/swagger';
import { JobDTO } from './job.dto';

export class UpdateJobDTO extends PartialType(JobDTO) {}
