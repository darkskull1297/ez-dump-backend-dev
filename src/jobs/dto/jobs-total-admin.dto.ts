import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class JobsTotalAdminDTO {
  @ApiPropertyOptional({ description: 'Total available jobs' })
  @IsOptional()
  @IsNumber()
  adminAvailable: number;

  @ApiPropertyOptional({ description: 'Total scheduled jobs' })
  @IsOptional()
  @IsNumber()
  adminScheduled: number;

  @ApiPropertyOptional({ description: 'Total pending jobs' })
  @IsOptional()
  @IsNumber()
  pending: number;

  @ApiPropertyOptional({ description: 'Total active jobs' })
  @IsOptional()
  @IsNumber()
  adminActive: number;

  @ApiPropertyOptional({ description: 'Total done jobs' })
  @IsOptional()
  @IsNumber()
  done: number;

  @ApiPropertyOptional({ description: 'Total  incomplete jobs' })
  @IsOptional()
  @IsNumber()
  incomplete: number;

  @ApiPropertyOptional({ description: 'Total scheduled canceled jobs' })
  @IsOptional()
  @IsNumber()
  scheduledCanceled?: number;

  @ApiPropertyOptional({ description: 'Total canceled jobs ' })
  @IsOptional()
  @IsNumber()
  canceled: number;

  @ApiPropertyOptional({ description: 'Total  Scheduled jobs Cancelled' })
  @IsOptional()
  @IsNumber()
  canceledScheduledJobs?: number;
}
