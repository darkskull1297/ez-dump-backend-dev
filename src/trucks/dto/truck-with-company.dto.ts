import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Length,
  IsNumberString,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TruckType } from '../truck-type';
import { TruckSubType } from '../truck-subtype';
import { Truck } from '../truck.model';
import { TruckStatus } from '../truck-status';
import { SimpleOwnerCompanyDTO } from '../../company/dto/simple-owner-company-dto';

export class TruckWithCompanyDTO {
  @ApiPropertyOptional({ description: "Truck's id" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: "Truck's number" })
  @IsString()
  number: string;

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

  @ApiPropertyOptional({ description: "Truck's miles" })
  @IsOptional()
  @IsNumber()
  miles?: number;

  @ApiPropertyOptional({ description: "Truck's status", enum: TruckStatus })
  @IsOptional()
  @IsEnum(TruckStatus)
  status?: TruckStatus;

  @ApiPropertyOptional({ description: 'Company', type: SimpleOwnerCompanyDTO })
  @IsOptional()
  @Type(() => SimpleOwnerCompanyDTO)
  @ValidateNested()
  company?: SimpleOwnerCompanyDTO;

  static fromModel(truck: Truck): TruckWithCompanyDTO {
    const {
      id,
      number,
      isDisable,
      isActive,
      type,
      subtype,
      grossTons,
      tareWeight,
      netTons,
      VINNumber,
      plateNumber,
      truckMakeAndModel,
      truckYear,
      miles,
      status,
      company,
    } = truck;

    return {
      id,
      number,
      isDisable,
      isActive,
      type,
      subtype,
      grossTons,
      tareWeight,
      netTons,
      VINNumber,
      plateNumber,
      truckMakeAndModel,
      truckYear,
      miles,
      status,
      company: SimpleOwnerCompanyDTO.fromModel(company),
    };
  }
}
