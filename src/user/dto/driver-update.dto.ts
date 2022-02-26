import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsArray,
  IsPositive,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Driver } from '../driver.model';
import { OwnerCompany } from '../../company/owner-company.model';
import { DriverPaymentMethods } from '../driverPaymentMethods';

export class DriverUpdateDTO {
  @ApiPropertyOptional({ readOnly: true })
  id: string;

  @ApiPropertyOptional({
    description: "Contractor's name",
    minLength: 3,
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
  name: string;

  @ApiPropertyOptional({ description: "Foreman's email address" })
  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: "Foreman's phone number" })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsString()
  dateOfBirth: string;

  @ApiPropertyOptional({ description: 'License Expired Date' })
  @IsOptional()
  @IsString()
  licenseExpiredDate: string;

  @ApiPropertyOptional({ description: 'Driver Licence Number' })
  @IsOptional()
  @IsString()
  licenseNumber: string;

  @ApiPropertyOptional({ description: 'Driver medical card' })
  @IsOptional()
  @IsString()
  medicalCard: string;

  @ApiPropertyOptional({ description: 'Driver medical card' })
  @IsOptional()
  @IsString()
  LicenseBack: string;

  @ApiPropertyOptional({ description: 'Driver medical card' })
  @IsOptional()
  @IsString()
  LicenseFront: string;

  @ApiPropertyOptional({ description: "Driver's price per hour" })
  @IsOptional()
  @IsNumber()
  pricePerHour: number;

  @ApiPropertyOptional({ description: "Driver's password " })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: "Driver's driving for" })
  @IsOptional()
  drivingFor: OwnerCompany;

  @ApiPropertyOptional({ description: 'Is driver active?' })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Is driver verified?' })
  @IsOptional()
  @IsBoolean()
  verifiedEmail: boolean;

  @ApiPropertyOptional({ description: "Driver's devices Id's" })
  @IsOptional()
  @IsArray()
  deviceID: string;

  @ApiPropertyOptional({ description: 'Driver Payment Method' })
  @IsOptional()
  @IsString()
  paymentMethod: DriverPaymentMethods;

  @ApiPropertyOptional({ description: 'Driver Payment Sub Method' })
  @IsOptional()
  @IsString()
  paymentSubMethod: DriverPaymentMethods;

  @ApiPropertyOptional({ description: 'Driver Payment Sub Method' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  percent: number;

  toModel?(): Omit<Driver, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      dateOfBirth: this.dateOfBirth,
      licenseNumber: this.licenseNumber,
      pricePerHour: this.pricePerHour,
      password: this.password,
      deviceID: this.deviceID,
      drivingFor: this.drivingFor,
      isActive: this.isActive,
      medicalCard: this.medicalCard,
      LicenseFront: this.LicenseFront,
      LicenseBack: this.LicenseBack,
      verifiedEmail: this.verifiedEmail,
      paymentMethod: this.paymentMethod,
      paymentSubMethod: this.paymentSubMethod,
      percent: this.percent,
      licenseExpiredDate: this.licenseExpiredDate,
    };
  }
}
