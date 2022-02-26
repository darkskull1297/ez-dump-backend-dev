import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class JobsTotalContractorDTO {
  @ApiPropertyOptional({ description: 'Total scheduled jobs' })
  @IsOptional()
  @IsNumber()
  scheduled: number;

  @ApiPropertyOptional({ description: 'Total pending jobs' })
  @IsOptional()
  @IsNumber()
  pending: number;

  @ApiPropertyOptional({ description: 'Total active jobs' })
  @IsOptional()
  @IsNumber()
  active: number;

  @ApiPropertyOptional({ description: 'Total done jobs' })
  @IsOptional()
  @IsNumber()
  done: number;

  @ApiPropertyOptional({ description: 'Total  incomplete jobs' })
  @IsOptional()
  @IsNumber()
  incomplete: number;

  @ApiPropertyOptional({ description: 'Total  Scheduled jobs Cancelled' })
  @IsOptional()
  @IsNumber()
  scheduledJobsCancelled?: number;

  @ApiPropertyOptional({ description: 'Total scheduled canceled jobs' })
  @IsOptional()
  @IsNumber()
  scheduledCanceled?: number;

  @ApiPropertyOptional({ description: 'Total canceled jobs ' })
  @IsOptional()
  @IsNumber()
  canceledJobs?: number;

  @ApiPropertyOptional({ description: 'Total Request truck ' })
  @IsOptional()
  @IsNumber()
  requestedTrucks?: number;
}
