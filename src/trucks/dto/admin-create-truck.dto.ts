import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNumber,
  Length,
  IsEnum,
  IsNumberString,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { TruckType } from '../truck-type';
import { TruckSubType } from '../truck-subtype';
import { Truck } from '../truck.model';

export class AdminCreateTruckDTO {
  @ApiProperty({ description: "Truck's number" })
  @IsString()
  number: string;

  @ApiProperty({ description: "Truck's companyId" })
  @IsString()
  @IsUUID()
  company?: string;

  @ApiPropertyOptional({ description: "Truck's Disabled (true or not)" })
  @IsBoolean()
  isDisable = false;

  @ApiPropertyOptional({ description: "Truck's status (active or not)" })
  @IsBoolean()
  isActive = true;

  @ApiProperty({ description: "Truck's type", enum: TruckType })
  @IsEnum(TruckType)
  type: TruckType;

  @ApiProperty({
    description: "Truck's subtype",
    isArray: true,
    enum: TruckSubType,
  })
  @IsEnum(TruckSubType, { each: true })
  @IsArray()
  subtype: TruckSubType[];

  @ApiProperty({ description: "Truck's gross tons" })
  @IsNumber()
  grossTons: number;

  @ApiProperty({ description: "Truck's tare weight" })
  @IsNumber()
  tareWeight: number;

  @ApiProperty({ description: "Truck's net tons" })
  @IsNumber()
  netTons: number;

  @ApiProperty({ description: "Truck's VIN number" })
  @IsString()
  @Length(17, 17)
  VINNumber: string;

  @ApiProperty({ description: "Truck's plate number" })
  @IsString()
  plateNumber: string;

  @ApiProperty({ description: "Truck's make and model" })
  @IsString()
  truckMakeAndModel: string;

  @ApiProperty({ description: "Truck's year" })
  @IsNumberString()
  @Length(4, 4)
  truckYear: string;

  toModel?(): Omit<Truck, 'id' | 'createdAt' | 'updatedAt' | 'company'> & {
    company: string;
  } {
    return {
      number: this.number,
      isDisable: this.isDisable,
      isActive: this.isActive,
      type: this.type,
      subtype: this.subtype,
      company: this.company,
      grossTons: this.grossTons,
      tareWeight: this.tareWeight,
      netTons: this.netTons,
      VINNumber: this.VINNumber,
      plateNumber: this.plateNumber,
      truckMakeAndModel: this.truckMakeAndModel,
      truckYear: this.truckYear,
    };
  }
}
