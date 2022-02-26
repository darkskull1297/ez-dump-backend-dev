import { IsArray, IsString, IsNumber, IsDate } from 'class-validator';

export class MaintenanceDTO {
  @IsArray()
  taskOrders: TaskOrder[];
}

class TaskOrder {
  @IsString()
  id: string;

  @IsNumber()
  orderNumber: number;

  @IsDate()
  createdAt: Date;

  @IsString()
  status: string;

  @IsString()
  type: string;

  @IsString()
  description: string;

  @IsNumber()
  interval: string;

  @IsNumber()
  currentMiles: number;
}
