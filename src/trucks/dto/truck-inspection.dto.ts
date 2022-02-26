import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';

export class TruckInspectionDTO {
  @IsArray()
  totalInspections: Inspection[];

  @IsNumber()
  failedInspections: number;

  @IsNumber()
  totalCompletedWorkOrders?: number;

  @IsNumber()
  totalPendingWorkOrders?: number;

  @IsNumber()
  totalWorkOrders?: number;

  @IsNumber()
  defects?: number;

  @IsNumber()
  inspectedDrivers?: number;

  @IsNumber()
  inspectedTrucks?: number;

  @IsNumber()
  totalDrivers?: number;

  @IsNumber()
  totalTrucks?: number;

  @IsArray()
  driversBoard?: DriversBoard[];

  @IsArray()
  trucksBoard?: TrucksBoard[];

  @IsArray()
  expensesBoard?: ExpensesBoard[];
}

class Asset {
  @IsString()
  title: string;

  @IsArray()
  image: string[];

  @IsNumber()
  id: number;

  @IsNumber()
  sub_id: number;

  @IsBoolean()
  passed: boolean;
}

class Inspection {
  @IsString()
  id: string;

  truck: { id: string; number: string };

  driver: { id: string; name: string };

  owner: { id: string; name: string };

  passedAssets: Asset[];

  unpassedAssets: Asset[];
}

class DriversBoard {
  @IsString()
  driverId: string;

  @IsString()
  driverName: string;

  @IsNumber()
  totalInspections: number;
}

class TrucksBoard {
  @IsString()
  truckId: string;

  @IsString()
  truckNumber: string;

  @IsNumber()
  totalInspections: number;
}

class ExpensesBoard {
  @IsString()
  truckId: string;

  @IsString()
  truckNumber: string;

  @IsNumber()
  labor: number;

  @IsNumber()
  parts: number;

  @IsNumber()
  totalCost: number;
}
