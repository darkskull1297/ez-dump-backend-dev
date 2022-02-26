import { IsString, IsNumber, IsDate, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { WorkOrderDTO } from './work-order.dto';
import { TruckDTO } from '../../trucks/dto/truck.dto';
import { UserDTO } from '../../user/dto/user.dto';

export class WorkOrderItemDTO {
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: "Work Order Item Number (only returned)",
    readOnly: true,
  })
  number?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsNumber()
  labor: number;

  @IsNumber()
  parts: number;

  @ApiPropertyOptional({
    description:  "Work Order Item's Work Order",
    readOnly: true,
  })
  @IsOptional()
  @Type(() => WorkOrderDTO)
  @ValidateNested()
  workOrder?: WorkOrderDTO[];

  @ApiPropertyOptional({ description: "Work Order Item's Truck", type: TruckDTO })
  @IsOptional()
  @ValidateNested()
  truck?: TruckDTO;

  @ApiPropertyOptional({ description: "Work Order Item's Assignee", readOnly: true })
  @IsOptional()
  @Type(() => UserDTO)
  @ValidateNested()
  user?: UserDTO;
}
