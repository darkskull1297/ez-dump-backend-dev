import {
  IsString,
  IsDate,
  IsInstance,
  IsEnum,
  ValidateNested,
  IsArray,
  IsOptional,
  MinDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Job } from '../job.model';
import { User } from '../../user/user.model';
import { AreTruckCategoriesUnique } from '../validators/unique-truck-categories.validator';
import { TruckCategoryDTO } from './truck-category.dto';
import { LocationDTO } from './location.dto';
import { UserDTO } from '../../user/dto/user.dto';
import { ContractorCompanyDTO } from '../../company/dto/contractor-company.dto';
import { ContractorCompany } from '../../company/contractor-company.model';
import { GeneralJobDto } from '../../general-jobs/dto/general-job.dto';
import { ScheduledJob } from '../scheduled-job.model';
import { Loads } from '../../geolocation/loads.model';

export class JobDTO {
  @ApiPropertyOptional({ description: "Job's id" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: "General Job's id", writeOnly: true })
  @IsOptional()
  @IsString()
  generalJobId?: string;

  @ApiPropertyOptional({ description: "Tequested Truck's id", writeOnly: true })
  @IsOptional()
  @IsString()
  requestedTruckId?: string;

  @ApiPropertyOptional({ description: "Job's name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Job's status" })
  @IsOptional()
  @IsString()
  status?: string;

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

  @ApiPropertyOptional({ description: "Job's contractor", readOnly: true })
  @IsOptional()
  @Type(() => UserDTO)
  @ValidateNested()
  @IsInstance(UserDTO)
  user?: UserDTO;

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

  @ApiPropertyOptional({
    description: "Job's order number (only returned)",
    readOnly: true,
  })
  orderNumber?: string;

  @ApiPropertyOptional({
    description: 'Finished at (only returned)',
    readOnly: true,
  })
  finishedAt?: Date;

  @ApiPropertyOptional({
    description: 'Canceled at (only returned)',
    readOnly: true,
  })
  canceledAt?: Date;

  @ApiPropertyOptional({
    description: 'Paid at (only returned)',
    readOnly: true,
  })
  paidAt?: Date;

  @ApiProperty({ description: "Job's material" })
  @IsString()
  material: string;

  @ApiProperty({ description: "Job's directions/instructions" })
  @IsString()
  directions: string;

  @ApiPropertyOptional({ description: 'Company Name' })
  companyName?: string;

  @ApiProperty({
    description: "Job's truck classifications",
    type: [TruckCategoryDTO],
  })
  @Type(() => TruckCategoryDTO)
  @IsArray()
  @ValidateNested({ each: true })
  @AreTruckCategoriesUnique()
  truckCategories: TruckCategoryDTO[];

  @ApiProperty({ description: "Job's due date" })
  @Type(() => Date)
  @IsDate()
  @MinDate(new Date())
  paymentDue: Date;

  @ApiPropertyOptional({
    description: "Job's unassigned trucks",
    readOnly: true,
  })
  @IsOptional()
  @Type(() => TruckCategoryDTO)
  @IsArray()
  @ValidateNested({ each: true })
  unassignedTrucks?: TruckCategoryDTO[];

  @ApiPropertyOptional({
    description: "Job's unassigned preferred trucks",
    readOnly: true,
  })
  @IsOptional()
  @Type(() => TruckCategoryDTO)
  @IsArray()
  @ValidateNested({ each: true })
  unassignedPreferredTrucks?: TruckCategoryDTO[];

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
  @IsInstance(GeneralJobDto)
  @ValidateNested()
  generalJob: GeneralJobDto;

  @ApiProperty({
    description: 'Preferred Trucks',
    type: [TruckCategoryDTO],
  })
  @Type(() => TruckCategoryDTO)
  @IsArray()
  @ValidateNested({ each: true })
  preferredTrucks: TruckCategoryDTO[];

  @ApiPropertyOptional({ description: 'Scheduled jobs' })
  @IsOptional()
  scheduledJobs?: ScheduledJob[];

  @ApiProperty({ description: 'Job Loads' })
  @IsOptional()
  loads?: Loads;

  // @ApiProperty({
  //   description: 'Truck Inspections',
  //   type: [TruckInspection],
  // })
  // @Type(() => TruckInspection)
  // @IsArray()
  // @ValidateNested({ each: true })
  // truckInspections: TruckInspection[];

  @ApiPropertyOptional({
    description: 'Does the job handles loads on the same site?',
    type: Boolean,
  })
  @IsOptional()
  onSite: boolean;

  @ApiPropertyOptional({
    description: 'Does job is in hold?',
    type: Boolean,
  })
  @IsOptional()
  onHold: boolean;

  toModel?(
    user: User,
  ): Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'truckCategories'> {
    return {
      name: this.name,
      startDate: this.startDate,
      endDate: this.endDate,
      loadSite: this.loadSite.toModel(),
      dumpSite: this.dumpSite.toModel(),
      material: this.material,
      directions: this.directions,
      paymentDue: this.paymentDue,
      user,
      onSite: this.onSite,
      // truckInspections: this.truckInspections,
      onHold: this.onHold,
    };
  }

  static fromModel(job: any): JobDTO {
    const {
      id,
      name,
      startDate,
      endDate,
      loadSite,
      dumpSite,
      material,
      directions,
      orderNumber,
      paymentDue,
      truckCategories,
      user,
      finishedAt,
      canceledAt,
      paidAt,
      onSite,
      onHold,
      status,
    } = job;

    const unassignedTrucks = truckCategories.filter(
      truckCategory => !truckCategory.isScheduled,
    );
    return {
      id,
      name,
      startDate,
      endDate,
      material,
      directions,
      paymentDue,
      orderNumber: `${orderNumber}`,
      finishedAt,
      canceledAt,
      paidAt,
      companyName: job.user.company?.companyCommon?.name,
      loadSite: LocationDTO.fromModel(loadSite),
      dumpSite: LocationDTO.fromModel(dumpSite),
      truckCategories: TruckCategoryDTO.fromArrayModel(
        truckCategories.filter(cat => cat.preferredTruck === null),
      ),
      preferredTrucks: TruckCategoryDTO.fromArrayModel(
        truckCategories.filter(cat => cat.preferredTruck !== null),
      ),
      user,
      unassignedTrucks: TruckCategoryDTO.fromArrayModel(
        unassignedTrucks.filter(truck => truck.preferredTruck === null),
      ),
      unassignedPreferredTrucks: TruckCategoryDTO.fromArrayModel(
        unassignedTrucks.filter(truck => truck.preferredTruck !== null),
      ),
      onSite,
      onHold,
      status,
    } as JobDTO;
  }

  static fromModelWithScheduledJobs(job: any): JobDTO {
    const {
      id,
      name,
      startDate,
      endDate,
      loadSite,
      dumpSite,
      material,
      directions,
      orderNumber,
      paymentDue,
      truckCategories,
      user,
      finishedAt,
      canceledAt,
      paidAt,
      onSite,
      onHold,
      scheduledJobs,
      loads,
      status,
    } = job;

    const unassignedTrucks = truckCategories.filter(
      truckCategory => !truckCategory.isScheduled,
    );
    return {
      id,
      name,
      startDate,
      endDate,
      material,
      directions,
      paymentDue,
      orderNumber: `${orderNumber}`,
      finishedAt,
      canceledAt,
      paidAt,
      scheduledJobs,
      companyName: job.user.company?.companyCommon?.name,
      loadSite: LocationDTO.fromModel(loadSite),
      dumpSite: LocationDTO.fromModel(dumpSite),
      truckCategories: truckCategories.filter(
        cat => cat.preferredTruck === null,
      ),
      preferredTrucks: truckCategories.filter(
        cat => cat.preferredTruck !== null,
      ),
      user,
      unassignedTrucks: unassignedTrucks.filter(
        truck => truck.preferredTruck === null,
      ),
      unassignedPreferredTrucks: unassignedTrucks.filter(
        truck => truck.preferredTruck !== null,
      ),
      loads,
      onSite,
      onHold,
      status,
    } as JobDTO;
  }

  static async fromModelWithContractorCompany(
    job: Job,
    contCompany: ContractorCompany,
  ): Promise<JobDTO> {
    const {
      id,
      name,
      startDate,
      endDate,
      loadSite,
      dumpSite,
      material,
      directions,
      orderNumber,
      paymentDue,
      truckCategories,
      user,
      finishedAt,
      canceledAt,
      paidAt,
      onSite,
    } = job;
    const unassignedTrucks = truckCategories.filter(
      truckCategory => !truckCategory.isScheduled,
    );
    return {
      id,
      name,
      startDate,
      endDate,
      material,
      directions,
      paymentDue,
      orderNumber: `${String(orderNumber).padStart(3, '0')}`,
      finishedAt,
      canceledAt,
      paidAt,
      loadSite: LocationDTO.fromModel(loadSite),
      dumpSite: LocationDTO.fromModel(dumpSite),
      truckCategories: TruckCategoryDTO.fromArrayModel(
        truckCategories.filter(cat => cat.preferredTruck === null),
      ),
      preferredTrucks: TruckCategoryDTO.fromArrayModel(
        truckCategories.filter(cat => cat.preferredTruck !== null),
      ),
      user: UserDTO.fromModel(user),
      unassignedTrucks: TruckCategoryDTO.fromArrayModel(
        unassignedTrucks.filter(truck => truck.preferredTruck === null),
      ),
      unassignedPreferredTrucks: TruckCategoryDTO.fromArrayModel(
        unassignedTrucks.filter(truck => truck.preferredTruck !== null),
      ),
      contractorCompany: await ContractorCompanyDTO.fromModel(contCompany),
      onSite,
    } as JobDTO;
  }
}
