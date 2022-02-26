import { IsArray, IsString, IsNumber, IsDate } from 'class-validator';

export class DriverBoardDTO {
  @IsArray()
  driver: { id: string; name: string };

  @IsArray()
  inspections: Inspection[];
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
}