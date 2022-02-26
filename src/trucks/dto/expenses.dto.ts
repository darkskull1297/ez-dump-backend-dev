import { IsArray, IsString, IsNumber, IsDate } from 'class-validator';

export class ExpensesDTO {
  @IsArray()
  workOrders: WorkOrder[];

  @IsNumber()
  totalExpenses: number;
}

class WorkOrder {
  @IsString()
  id: string;

  @IsNumber()
  orderNumber: number;

  @IsDate()
  createdAt: Date;

  @IsString()
  itemName: string;

  @IsString()
  status: string;

  @IsNumber()
  labor: number;

  @IsNumber()
  parts: number;

  @IsNumber()
  totalCost: number;

  @IsString()
  mechanic: string;
}
