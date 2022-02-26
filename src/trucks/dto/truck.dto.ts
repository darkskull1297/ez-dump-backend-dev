import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Length,
  IsNumberString,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { TruckType } from '../truck-type';
import { TruckSubType } from '../truck-subtype';
import { Truck } from '../truck.model';
import { TruckStatus } from '../truck-status';
import { ReviewTruck } from '../../reviews/review-truck.model';

export class TruckDTO {
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

  @ApiPropertyOptional({ description: "Truck's status", enum: TruckStatus })
  @IsOptional()
  @IsEnum(TruckStatus)
  status?: TruckStatus;

  @ApiPropertyOptional({
    description:
      'Truck is  reviewed ( only returned when getting scheduled job trucks',
  })
  @IsOptional()
  reviewed?: boolean;

  @ApiPropertyOptional({
    description: 'Trucks',
  })
  @IsOptional()
  reviews?: ReviewTruck[];

  @ApiPropertyOptional({ description: "Truck's status" })
  @IsOptional()
  miles?: number;

  @ApiProperty({ description: "Truck's plate number" })
  @IsString()
  registrationCard?: string;

  toModel?(): Omit<Truck, 'id' | 'createdAt' | 'updatedAt' | 'company'> {
    return {
      number: this.number,
      isDisable: this.isDisable,
      isActive: this.isActive,
      type: this.type,
      subtype: this.subtype,
      grossTons: this.grossTons,
      tareWeight: this.tareWeight,
      netTons: this.netTons,
      VINNumber: this.VINNumber,
      plateNumber: this.plateNumber,
      truckMakeAndModel: this.truckMakeAndModel,
      truckYear: this.truckYear,
      reviews: this.reviews,
      miles: this.miles,
      registrationCard: this.registrationCard,
    };
  }

  static fromModel(truck: Truck): TruckDTO {
    // if (truck) {
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
      status,
      reviews,
      miles,
      registrationCard,
    } = truck || {};

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
      status,
      reviews,
      miles,
      registrationCard,
    };
    // }
  }

  static fromModelWithReview(truck: Truck, isReviewed: boolean): TruckDTO {
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
      status,
      reviews,
      miles,
      registrationCard,
    } = truck || {};

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
      status,
      reviewed: isReviewed,
      reviews,
      miles,
      registrationCard,
    };
  }
}
