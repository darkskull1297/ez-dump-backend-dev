import {
  IsString,
  IsDate,
  IsInstance,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Job } from '../job.model';
import { LocationDTO } from './location.dto';
import { Loads } from '../../geolocation/loads.model';
import { TruckCategory } from '../../trucks/truck-category.model';
import { ScheduledJob } from '../scheduled-job.model';
import { User } from '../../user/user.model';

export class SimpleJobDTO {
  @ApiProperty({ description: "Job's id" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: "Job's name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Job's start date" })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ description: "Job's end date" })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ description: "Job's contractor" })
  @IsOptional()
  @Type(() => User)
  @ValidateNested()
  @IsInstance(User)
  user?: User;

  @ApiProperty({ description: "Job's load site" })
  @Type(() => LocationDTO)
  @ValidateNested()
  @IsInstance(LocationDTO)
  loadSite: LocationDTO;

  @ApiProperty({ description: "Job's dump site" })
  @Type(() => LocationDTO)
  @ValidateNested()
  @IsInstance(LocationDTO)
  dumpSite: LocationDTO;

  @ApiProperty({ description: "Job's material" })
  @IsString()
  material: string;

  @ApiProperty({ description: "Job's directions/instructions" })
  @IsString()
  directions: string;

  orderNumber?: number;

  @ApiPropertyOptional({
    description: 'Status',
    nullable: true,
    readOnly: true,
  })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'On site?',
    nullable: false,
    readOnly: true,
  })
  @IsOptional()
  onSite: boolean;

  @ApiPropertyOptional({
    description: 'On hold?',
    nullable: false,
    readOnly: true,
  })
  @IsOptional()
  onHold: boolean;

  @ApiPropertyOptional({ description: 'Job loads' })
  @IsOptional()
  loads?: Loads[];

  @ApiPropertyOptional({ description: 'Job categories' })
  @IsOptional()
  categories?: TruckCategory[];

  @ApiPropertyOptional({ description: 'Job categories' })
  @IsOptional()
  scheduledJobs?: ScheduledJob[];

  static fromModel(job: Job): SimpleJobDTO {
    const {
      id,
      name,
      startDate,
      endDate,
      loadSite,
      dumpSite,
      material,
      directions,
      user,
      status,
      orderNumber,
      onSite,
      onHold,
      loads,
      truckCategories,
      scheduledJobs,
    } = job || {};

    return {
      id,
      name,
      status,
      startDate,
      endDate,
      material,
      directions,
      orderNumber,
      loadSite: LocationDTO.fromModel(loadSite),
      dumpSite: LocationDTO.fromModel(dumpSite),
      user,
      onSite,
      onHold,
      loads,
      categories: truckCategories,
      scheduledJobs,
    };
  }
}
