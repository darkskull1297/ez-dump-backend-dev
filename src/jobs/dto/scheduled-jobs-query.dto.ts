import { Matches, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDTO } from '../../common/pagination.dto';

export class ScheduledJobsQueryDTO extends PaginationDTO {
  @ApiPropertyOptional({ description: 'Start (MM-yyyy)' })
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2])-(19|2[0-1])\d{2}$/)
  start: string;

  @ApiPropertyOptional({ description: 'End (MM-yyyy)' })
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2])-(19|2[0-1])\d{2}$/)
  end: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(value => {
    if (value === 'true') return true;
    return false;
  })
  active: boolean;
}
