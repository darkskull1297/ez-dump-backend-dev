import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class JobsTotalOwnerDTO {
  @ApiPropertyOptional({ description: 'Total scheduled jobs' })
  @IsOptional()
  @IsNumber()
  scheduledJobs: number;

  @ApiPropertyOptional({ description: 'Total available jobs' })
  @IsOptional()
  @IsNumber()
  availableJobs: number;

  @ApiPropertyOptional({ description: 'Total active jobs' })
  @IsOptional()
  @IsNumber()
  activeJobs: number;

  @ApiPropertyOptional({ description: 'Total done jobs' })
  @IsOptional()
  @IsNumber()
  doneJobs: number;

  @ApiPropertyOptional({ description: 'Total incompleted jobs' })
  @IsOptional()
  @IsNumber()
  incompleteJobs: number;
}
