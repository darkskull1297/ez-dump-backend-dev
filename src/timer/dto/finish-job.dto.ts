import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class FinishJobDTO {
  @ApiProperty({ description: 'Signature URL' })
  @IsString()
  signature: string;

  @ApiPropertyOptional({ description: 'Tons transported' })
  @IsOptional()
  tons?: number;

  @ApiPropertyOptional({ description: 'Load transported' })
  @IsOptional()
  load?: number;

  @ApiPropertyOptional({ description: 'Comment added' })
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'Finish Job Evidence' })
  @IsOptional()
  evidenceImgs?: string[];

  @ApiPropertyOptional({ description: 'Total travels' })
  @IsOptional()
  totalTravels?: number;

  @ApiPropertyOptional({ description: 'Supervisor name' })
  @IsOptional()
  supervisorName?: string;

  @ApiPropertyOptional({ description: 'Supervisor comment' })
  @IsOptional()
  supervisorComment?: string;

  @ApiPropertyOptional({ description: 'Supervisor comment' })
  @IsOptional()
  @IsNumber()
  timeSupervisor?: number;

  @ApiPropertyOptional({ description: 'Job ID' })
  @IsOptional()
  @IsString()
  loadsId?: string;
}
