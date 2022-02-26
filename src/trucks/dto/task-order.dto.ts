import { IsString, IsNumber, IsDate, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { WorkOrderDTO } from './work-order.dto';
import { TruckDTO } from '../../trucks/dto/truck.dto';
import { UserDTO } from '../../user/dto/user.dto';

export class TaskOrderDTO {
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: "Task Order Number (only returned)",
    readOnly: true,
  })
  orderNumber?: string;

  @ApiPropertyOptional({ description: "Task Order's Deleted (true or not)" })
  @IsBoolean()
  isDeleted = false;

  @IsOptional()
  @IsDate()
  doneAt?: Date;

  @IsString()
  status: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  interval: string;

  @IsNumber()
  milesToTask: number;

  @IsNumber()
  currentMiles: number;

  @IsOptional()
  @IsNumber()
  lastTaskDoneOrderNumber?: number;

  @IsOptional()
  @IsDate()
  lastTaskDoneAt?: Date;

  @IsOptional()
  @IsNumber()
  lastTaskMiles?: number;

  @ApiPropertyOptional({
    description:  "Task Order's Work Order",
    readOnly: true,
  })
  @IsOptional()
  @Type(() => WorkOrderDTO)
  @ValidateNested()
  workOrder?: WorkOrderDTO[];

  @ApiProperty({ description: "Task Order's Truck", type: TruckDTO })
  @ValidateNested()
  truck: TruckDTO;

  @ApiPropertyOptional({ description: "Task Order's Assignee", readOnly: true })
  @Type(() => UserDTO)
  @ValidateNested()
  user: UserDTO;
}
