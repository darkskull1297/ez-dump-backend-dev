import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDate, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class DisputeInvoiceSolvedDTO {
  @ApiPropertyOptional({ description: 'Start date' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Tons' })
  @IsOptional()
  tons?: number;

  @ApiPropertyOptional({ description: 'Tons' })
  @IsOptional()
  load?: number;

  @ApiPropertyOptional({ description: 'Result of dispute' })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({ description: 'Resolution of dispute' })
  @IsString()
  @IsOptional()
  resolution?: string;

  @ApiPropertyOptional({ description: 'Resume images' })
  @IsArray()
  resultResume?: string[];

  @ApiPropertyOptional({ description: 'Evidence images' })
  @IsArray()
  evidences?: string[];
}
