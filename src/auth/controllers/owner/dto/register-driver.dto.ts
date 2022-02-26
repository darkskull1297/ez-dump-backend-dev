import {
  IsString,
  MinLength,
  MaxLength,
  IsUrl,
  IsPositive,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Driver } from '../../../../user/driver.model';
import { DriverPaymentMethods } from '../../../../user/driverPaymentMethods';

export class RegisterDriverDTO {
  @ApiProperty({ description: "Driver's name", minLength: 3, maxLength: 32 })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  name: string;

  @ApiProperty({ description: "Driver's email address" })
  @IsOptional()
  @IsString()
  email: string;

  @ApiProperty({ description: "Driver's phone number" })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Date of birth (DD-MM-YYYY)' })
  @IsString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Date of birth (DD-MM-YYYY)' })
  @IsString()
  licenseExpiredDate: string;

  @ApiProperty({ description: 'License number' })
  @IsString()
  licenseNumber: string;

  @ApiProperty({ description: 'Medical card URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  medicalCard?: string;

  @ApiProperty({ description: 'Picture license Back URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  LicenseBack?: string;

  @ApiProperty({ description: 'Picture license front URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  LicenseFront?: string;

  @ApiProperty({ description: 'Price per hour' })
  @IsNumber()
  @IsPositive()
  pricePerHour: number;

  @ApiProperty({ description: 'Payment Method' })
  @IsString()
  paymentMethod: DriverPaymentMethods;

  @ApiProperty({ description: 'Payment Sub Method' })
  @IsString()
  paymentSubMethod: DriverPaymentMethods;

  @ApiProperty({ description: 'Payment Sub Method' })
  @IsNumber()
  @IsPositive()
  percent: number;

  toModel?(): Omit<Driver, 'id' | 'updatedAt' | 'createdAt' | 'password'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      dateOfBirth: this.dateOfBirth,
      licenseNumber: this.licenseNumber,
      medicalCard: this.medicalCard,
      LicenseBack: this.LicenseBack,
      LicenseFront: this.LicenseFront,
      pricePerHour: this.pricePerHour,
      paymentMethod: this.paymentMethod,
      paymentSubMethod: this.paymentSubMethod,
      percent: this.percent,
      licenseExpiredDate: this.licenseExpiredDate,
    };
  }
}
