import { IsArray, IsString, IsDate } from 'class-validator';

export class DriversBoardDTO {
  @IsArray()
  drivers: Driver[];
}

class Driver {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  inspectionId: string;

  @IsDate()
  inspectionCreatedAt: Date;

  @IsString()
  inspectionStatus: string;

  @IsString()
  inspectionType: string;

  @IsString()
  totalInspections: string;
}
