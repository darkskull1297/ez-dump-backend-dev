import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Material } from '../material.model';
import { TruckType } from '../../trucks/truck-type';
import { JobCommodity } from '../../jobs/job-commodity';

export class MaterialDTO {
  @ApiProperty({ description: "Material's name" })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Bill customer' })
  @IsString()
  billCustomer: string;

  @ApiProperty({ description: 'Subcontractor rate' })
  @IsString()
  subcontractorRate: string;

  @ApiProperty({ description: 'Partner rate' })
  @IsString()
  partnerRate: string;

  @ApiProperty({ description: 'Truck Type' })
  @IsEnum(TruckType)
  truckType: TruckType;

  @ApiProperty({ description: 'Pay by' })
  @IsEnum(JobCommodity)
  payBy: JobCommodity;

  toModel?(): Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'generalJob'> {
    return {
      name: this.name,
      billCustomer: this.billCustomer,
      subcontractorRate: this.subcontractorRate,
      partnerRate: this.partnerRate,
      truckType: this.truckType,
      payBy: this.payBy,
    };
  }

  static fromModel(material: Material): MaterialDTO {
    const {
      name,
      billCustomer,
      subcontractorRate,
      partnerRate,
      truckType,
      payBy,
    } = material;
    return {
      name,
      billCustomer,
      subcontractorRate,
      partnerRate,
      truckType,
      payBy,
    };
  }
}
