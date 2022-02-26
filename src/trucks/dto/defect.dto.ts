import { IsArray, IsNumber, IsString, IsDate, IsOptional } from 'class-validator';

export class DefectDTO {
  @IsString()
  id: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  fixedAt: Date;

  @IsNumber()
  assetNumber: number;

  @IsString()
  status: string;

  @IsString()
  title: string;

  @IsString()
  cardTitle: string;

  @IsNumber()
  cardId: number;

  @IsNumber()
  assetId: number;

  @IsString()
  image: string;

  @IsNumber()
  truckInspectionInspectionNumber: number;

  @IsString()
  driver: string;

  @IsString()
  truckId: string;

  @IsString()
  workOrderId: string;

  @IsOptional()
  @IsArray()
  truck?: {
    number: string;
    makemodel: string;
    year: string;
    license: string;
    vin: string;
  };
}
