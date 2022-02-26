import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDTO } from '../../common/pagination.dto';

export class ContractorScheduledJobsQueryDTO extends PaginationDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(value => {
    if (value === 'true') return true;
    return false;
  })
  active: boolean;
}
