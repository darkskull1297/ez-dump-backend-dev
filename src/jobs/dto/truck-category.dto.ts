/* eslint-disable radix */
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { TruckType } from '../../trucks/truck-type';
import { TruckSubType } from '../../trucks/truck-subtype';
import { TruckCategory } from '../../trucks/truck-category.model';
import { JobAssignation } from '../job-assignation.model';
import { JobCommodity } from '../job-commodity';

export class TruckCategoryDTO {
  @ApiProperty({ description: 'Category ID' })
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: "Job's truck assignation",
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  assignation?: JobAssignation;

  @ApiProperty({
    description: "Job's truck types",
    enum: TruckType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(TruckType, { each: true })
  truckTypes: TruckType[];

  @ApiProperty({
    description: "Job's truck subtypes",
    enum: TruckSubType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(TruckSubType, { each: true })
  truckSubtypes: TruckSubType[];

  @ApiProperty({ description: 'Category price for subcontractor (Owner)' })
  @IsOptional()
  @IsArray()
  price: number[];

  @ApiProperty({ description: 'Category price for customer' })
  @IsOptional()
  @IsArray()
  customerRate?: number[];

  @ApiProperty({ description: 'Category price for partner' })
  @IsOptional()
  @IsArray()
  partnerRate?: number[];

  @ApiProperty({ description: "Job's truck amount" })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  amount?: number = 1;

  @ApiProperty({ description: 'Preferred Truck' })
  @IsString()
  @IsOptional()
  preferredTruck?: string;

  @ApiProperty({ description: 'Pay by category' })
  @IsArray()
  payBy?: JobCommodity[];

  @ApiProperty({ description: 'Is the truck disabled?' })
  @IsOptional()
  isDisable?: boolean;

  @ApiProperty({ description: 'Is the truck active?' })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Is the truck scheduled?' })
  @IsOptional()
  isScheduled?: boolean;

  toModel?(): Omit<
  TruckCategory,
  'id' | 'createdAt' | 'updatedAt' | 'job' | 'amount'
  >[] {
    return new Array(this.amount).fill({
      truckTypes: this.truckTypes,
      truckSubtypes: this.truckSubtypes,
      price: this.price,
      preferredTruck: this.preferredTruck,
      payBy: this.payBy,
      customerRate: this.customerRate,
      partnerRate: this.partnerRate,
      isActive: this.isActive || false,
      isScheduled: this.isScheduled || false,
      id: this.id || null,
    });
  }

  static fromModel?(truckCategory: TruckCategory): TruckCategoryDTO {
    const {
      assignation,
      truckTypes,
      truckSubtypes,
      price,
      payBy,
      customerRate,
      partnerRate,
    } = truckCategory || {};
    return {
      assignation,
      truckTypes,
      truckSubtypes,
      price,
      payBy,
      customerRate,
      partnerRate,
    };
  }

  static fromArrayModel?(truckCategories: TruckCategory[]): TruckCategoryDTO[] {
    const categoriesMap = {};

    if (!truckCategories) return [];

    truckCategories.forEach(category => {
      const key = !category.preferredTruck
        ? `${category.truckTypes.join('/')}-${category.truckSubtypes.join('/')}`
        : `${category.truckTypes.join('/')}-${category.truckSubtypes.join(
          '/',
        )}-${category.preferredTruck.id}`;

      const amount = !categoriesMap[key] ? 1 : categoriesMap[key].amount + 1;

      categoriesMap[key] = {
        amount,
        price: category.price,
        preferredTruck: category.preferredTruck,
        customerRate: category.customerRate,
        partnerRate: category.partnerRate,
        id: category.id,
        payBy: category.payBy,
        isScheduled: category.isScheduled,
        isActive: category.isActive,
      };
    });

    return Object.keys(categoriesMap).map(key => {
      const [truckTypesString, truckSubtypesString] = key.split('-');
      const truckTypes = truckTypesString.split('/');
      const truckSubtypes = truckSubtypesString.split('/');
      const {
        amount,
        price,
        preferredTruck,
        id,
        payBy,
        customerRate,
        partnerRate,
        isScheduled,
        isActive,
      } = categoriesMap[key];

      return {
        id,
        price,
        customerRate,
        partnerRate,
        amount: +amount,
        truckTypes: truckTypes.map(truckType => TruckType[truckType]),
        truckSubtypes: truckSubtypes.map(
          truckSubtype => TruckSubType[truckSubtype],
        ),
        preferredTruck,
        payBy,
        isScheduled,
        isActive,
      };
    });
  }
}
