import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { IsSimpleDate } from '../../util/simple-date.validator';
import { CustomInsurance } from '../custom-insurance.model';

export class CustomInsuranceDTO {
  @ApiProperty({ description: 'Insurance name' })
  @IsString()
  insuranceName: string;

  @ApiProperty({ description: 'Insurance number' })
  @IsString()
  insuranceNumber: string;

  @ApiProperty({ description: 'Insurance expiration date (DD-MM-YYYY)' })
  @IsString()
  @IsSimpleDate()
  expirationDate: string;

  @ApiProperty({ description: 'Insurance certificate' })
  @IsString()
  certificate: string;

  toModel?(): Omit<
  CustomInsurance,
  'id' | 'createdAt' | 'updatedAt' | 'company'
  > {
    return {
      insuranceName: this.insuranceName,
      insuranceNumber: this.insuranceNumber,
      expirationDate: this.expirationDate,
      certificate: this.certificate,
    };
  }

  static fromModel(insurance: CustomInsurance): CustomInsuranceDTO {
    const {
      insuranceName,
      insuranceNumber,
      expirationDate,
      certificate,
    } = insurance;
    return {
      insuranceName,
      insuranceNumber,
      expirationDate,
      certificate,
    };
  }
}
