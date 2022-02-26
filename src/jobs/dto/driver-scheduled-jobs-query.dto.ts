import { Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDTO } from '../../common/pagination.dto';

export class DriverScheduledJobsQueryDTO extends PaginationDTO {
  @ApiProperty({ description: 'Start (MM-yyyy)' })
  @Matches(/^(0[1-9]|1[0-2])-(19|2[0-1])\d{2}$/)
  start: string;

  @ApiProperty({ description: 'End (MM-yyyy)' })
  @Matches(/^(0[1-9]|1[0-2])-(19|2[0-1])\d{2}$/)
  end: string;
}
