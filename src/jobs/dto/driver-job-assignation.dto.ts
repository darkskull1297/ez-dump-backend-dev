import { ValidateNested, IsInstance } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { TruckDTO } from '../../trucks/dto/truck.dto';
import { TruckCategoryDTO } from './truck-category.dto';
import { JobAssignation } from '../job-assignation.model';
import {JobCommodity} from '../job-commodity';

export class DriverJobAssignationDTO {
  @ApiProperty({ description: 'Truck', type: TruckDTO })
  @IsInstance(TruckDTO)
  @ValidateNested()
  truck: TruckDTO;

  @ApiProperty({ description: 'Category', type: TruckCategoryDTO })
  @IsInstance(TruckCategoryDTO)
  @ValidateNested()
  category: TruckCategoryDTO;

  @ApiProperty({ description: 'Started at' })
  startedAt?: Date;

  @ApiProperty({ description: 'Finished at' })
  finishedAt?: Date;

  @ApiProperty({ description: 'Loads' })
  load?: number;

  @ApiProperty({ description: 'Pay By' })
  payBy?: JobCommodity;

  static fromModel(jobAssignation: JobAssignation): DriverJobAssignationDTO {
    const { truck, category, payBy } = jobAssignation;
    return {
      truck: TruckDTO.fromModel(truck),
      category: TruckCategoryDTO.fromModel(category),
      payBy
    };
  }

  static fromModelWithDates(
    jobAssignation: JobAssignation,
  ): DriverJobAssignationDTO {
    const { truck, category, startedAt, finishedAt, load, payBy } = jobAssignation;
    return {
      truck: TruckDTO.fromModel(truck),
      category: TruckCategoryDTO.fromModel(category),
      startedAt,
      finishedAt,
      load,
      payBy
    };
  }
}
