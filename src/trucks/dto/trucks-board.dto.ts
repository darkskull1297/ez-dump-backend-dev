import { IsArray, IsString, IsNumber, IsDate } from 'class-validator';

export class TrucksBoardDTO {
  @IsArray()
  trucks: Truck[];
}

class Truck {
  @IsString()
  id: string;

  @IsString()
  number: string;

  @IsString()
  inspectionId: string;

  @IsDate()
  inspectionCreatedAt: Date;

  @IsString()
  inspectionStatus: string;

  @IsString()
  inspectionType: string;

  @IsNumber()
  inspectionMiles: number;

  @IsString()
  inspectionDriver: string;
}
