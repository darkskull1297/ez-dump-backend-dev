import { IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsAssignationUnique } from '../validators/unique-assignations.validator';

export class CreateJobAssignationDTO {
  @ApiProperty({ description: 'Driver Id' })
  @IsString()
  driverId: string;

  @ApiProperty({ description: 'Truck Id' })
  @IsString()
  truckId: string;
}

export class ScheduleJobDTO {
  @ApiProperty({ description: 'Job Id' })
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'Job assignations',
    type: [CreateJobAssignationDTO],
  })
  @Type(() => CreateJobAssignationDTO)
  @IsArray()
  @ValidateNested({ each: true })
  @IsAssignationUnique()
  jobAssignations: CreateJobAssignationDTO[];
}
