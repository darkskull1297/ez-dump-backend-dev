import {
  IsString,
  IsDate,
  IsInstance,
  ValidateNested,
  IsArray,
  IsOptional,
  MinDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AreTruckCategoriesUnique } from '../validators/unique-truck-categories.validator';
import { TruckCategoryDTO } from './truck-category.dto';
import { LocationDTO } from './location.dto';
import { ContractorCompanyDTO } from '../../company/dto/contractor-company.dto';
import { GeneralJobDto } from '../../general-jobs/dto/general-job.dto';

export class RequestTruckDTO {
  @ApiPropertyOptional({ description: "Job's id" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: "General Job's id", writeOnly: true })
  @IsOptional()
  @IsString()
  generalJobId?: string;

  @ApiProperty({ description: "Job's start date" })
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date())
  startDate: Date;

  @ApiProperty({ description: "Job's end date" })
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date())
  endDate: Date;

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

  @ApiProperty({
    description: "Job's truck classifications",
    type: [TruckCategoryDTO],
  })
  @Type(() => TruckCategoryDTO)
  @IsArray()
  @ValidateNested({ each: true })
  @AreTruckCategoriesUnique()
  truckCategories: TruckCategoryDTO[];

  @IsOptional()
  @Type(() => TruckCategoryDTO)
  @IsArray()
  @ValidateNested({ each: true })
  unassignedTrucks?: TruckCategoryDTO[];

  @ApiPropertyOptional({
    description: 'Job contractor company',
    readOnly: true,
  })
  @IsOptional()
  @Type(() => ContractorCompanyDTO)
  @IsArray()
  @ValidateNested()
  contractorCompany?: ContractorCompanyDTO;

  @ApiPropertyOptional({
    description: 'General Job',
    type: GeneralJobDto,
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  generalJob: string;

  @ApiPropertyOptional({
    description: 'on site job',
    type: Boolean,
    readOnly: true,
  })
  @IsOptional()
  @IsBoolean()
  onSite: boolean;
}
