import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { IsSimpleDate } from '../../util/simple-date.validator';
import { Insurance } from '../insurance.model';

export class InsuranceDTO {
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

  toModel?(): Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      insuranceNumber: this.insuranceNumber,
      expirationDate: this.expirationDate,
      certificate: this.certificate,
    };
  }

  static fromModel(insurance: Insurance): InsuranceDTO {
    const { insuranceNumber, expirationDate, certificate } = insurance;
    return {
      insuranceNumber,
      expirationDate,
      certificate,
    };
  }
}
