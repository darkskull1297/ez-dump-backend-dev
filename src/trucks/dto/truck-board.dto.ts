import { IsArray, IsString, IsNumber, IsDate } from 'class-validator';

export class TruckBoardDTO {
  @IsArray()
  truck: {
    id: string;
    number: string;
    totalMiles: number
  };

  @IsArray()
  inspections: Inspection[];

  @IsArray()
  defects: Defect[];

  // Work Orders will be displayed in Expenses Table (when the modal is selected)
  @IsArray()
  workOrders: WorkOrder[];

  @IsArray()
  taskOrders: TaskOrder[];

  @IsNumber()
  totalPassedInspections: number;

  @IsNumber()
  totalFailedInspections: number;

  @IsNumber()
  totalReportedDefects: number;

  @IsNumber()
  totalCorrectedDefects: number;

  @IsNumber()
  totalOverdueTaskOrders: number;

  @IsNumber()
  totalPendingTaskOrders: number;

  @IsNumber()
  totalExpenses: number;
}

class Inspection {
  @IsString()
  id: string;

  @IsNumber()
  number: number;

  @IsDate()
  createdAt: Date;

  @IsString()
  status: string;

  @IsString()
  type: string;

  @IsNumber()
  miles: number;

  @IsString()
  driver: string;
}

class Defect {
  @IsString()
  id: string;

  @IsNumber()
  number: number;

  @IsDate()
  createdAt: Date;

  @IsString()
  status: string;

  @IsString()
  defect: string;

  @IsString()
  mechanic: string;
}

class WorkOrder {
  @IsString()
  id: string;

  @IsNumber()
  orderNumber: number;

  @IsDate()
  createdAt: Date;

  @IsString()
  status: string;

  @IsString()
  itemName: string;

  @IsNumber()
  labor: number;

  @IsNumber()
  parts: number;

  @IsNumber()
  totalCost: number;
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
  title: string;

  @IsString()
  description: string;

  @IsString()
  interval: string;

  @IsNumber()
  milesToTask: number;

  @IsNumber()
  currentMiles: number;
}
