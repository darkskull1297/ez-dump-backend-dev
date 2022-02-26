import { IsString, IsNumber, IsDate, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { WorkOrderItemDTO } from './work-order-item.dto';
import { Assets } from '../assets.model';
import { TaskOrderDTO } from './task-order.dto';
import { TruckDTO } from '../../trucks/dto/truck.dto';
import { UserDTO } from '../../user/dto/user.dto';

export class WorkOrderDTO {
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: "Work Order Number (only returned)",
    readOnly: true,
  })
  orderNumber?: string;

  @ApiPropertyOptional({
    description: "Paid Date",
  })
  paidAt?: Date;

  @IsDate()
  dueDate: Date;

  @IsString()
  status: string;

  @IsString()
  mechanic: string;

  @IsNumber()
  miles: number;

  @ApiPropertyOptional({
    description:  "Work Order's Items",
    readOnly: true,
  })
  @IsOptional()
  @Type(() => WorkOrderItemDTO)
  @ValidateNested()
  workOrderItems?: WorkOrderItemDTO[];

  @ApiPropertyOptional({
    description:  "Work Order's Defect",
    readOnly: true,
  })
  @IsOptional()
  @Type(() => Assets)
  @ValidateNested()
  assets?: Assets;

  @ApiPropertyOptional({
    description:  "Work Order's Task Order",
    readOnly: true,
  })
  @IsOptional()
  @Type(() => TaskOrderDTO)
  @ValidateNested()
  taskOrder?: TaskOrderDTO[];

  @ApiProperty({ description: "Work Order's Truck", type: TruckDTO })
  @ValidateNested()
  truck: TruckDTO;

  @ApiPropertyOptional({ description: "Work Order's Assignee", readOnly: true })
  @Type(() => UserDTO)
  @ValidateNested()
  user: UserDTO;
}
