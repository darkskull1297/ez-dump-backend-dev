import {
  ValidateNested,
  IsInstance,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserDTO } from '../../user/dto/user.dto';
import { TruckDTO } from '../../trucks/dto/truck.dto';
import { TruckCategoryDTO } from './truck-category.dto';
import { JobAssignation } from '../job-assignation.model';

export class JobAssignationDTO {
  @ApiProperty({ description: 'Id' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Driver', type: UserDTO })
  @IsInstance(UserDTO)
  @ValidateNested()
  driver: UserDTO;

  @ApiProperty({ description: 'Truck', type: TruckDTO })
  @IsInstance(TruckDTO)
  @ValidateNested()
  truck: TruckDTO;

  @ApiProperty({ description: 'Category', type: TruckCategoryDTO })
  @IsInstance(TruckCategoryDTO)
  @ValidateNested()
  category: TruckCategoryDTO;

  @ApiPropertyOptional({ description: 'Tons' })
  @IsOptional()
  tons?: number;

  @ApiPropertyOptional({ description: 'Tons' })
  @IsOptional()
  load?: number;

  @ApiPropertyOptional({ description: 'Started at' })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Finished at' })
  finishedAt?: Date;

  @ApiPropertyOptional({ description: 'Switch Status' })
  @IsString()
  switchStatus?: string;

  @ApiPropertyOptional({ description: 'Travel Time Supervisor' })
  @IsNumber()
  travelTimeSupervisor?: number;

  static fromModel(jobAssignation: JobAssignation): JobAssignationDTO {
    const {
      id,
      driver,
      truck,
      category,
      tons,
      load,
      startedAt,
      finishedAt,
      switchStatus,
      travelTimeSupervisor,
    } = jobAssignation;
    return {
      id,
      driver: UserDTO.fromModel(driver),
      truck: TruckDTO.fromModel(truck),
      category: TruckCategoryDTO.fromModel(category),
      tons,
      load,
      startedAt,
      finishedAt,
      switchStatus,
      travelTimeSupervisor,
    };
  }

  static fromModelWithoutCategory(driver, truck): JobAssignationDTO {
    return {
      driver: UserDTO.fromModel(driver),
      truck: TruckDTO.fromModel(truck),
      category: new TruckCategoryDTO(),
    };
  }
}
