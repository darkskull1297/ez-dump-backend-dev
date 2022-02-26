import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Driver } from '../driver.model';
import { IsSimpleDate } from '../../util/simple-date.validator';
import { DriverStatus } from '../driver-status';
import { SimpleOwnerCompanyDTO } from '../../company/dto/simple-owner-company-dto';
import { DriverPaymentMethods } from '../driverPaymentMethods';

export class DriverDTO {
  @ApiPropertyOptional({ description: "User's id" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: "Driver's name", minLength: 3, maxLength: 32 })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
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

  @ApiProperty({ description: 'License Expired Date (DD-MM-YYYY)' })
  @IsString()
  licenseExpiredDate: string;

  @ApiProperty({ description: 'License number' })
  @IsString()
  licenseNumber: string;

  @ApiPropertyOptional({ description: 'Medical card URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  medicalCard: string;

  @ApiPropertyOptional({ description: 'Picture license Back URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  LicenseBack?: string;

  @ApiPropertyOptional({ description: 'Picture license front URL' })
  @IsString()
  @IsUrl()
  @IsOptional()
  LicenseFront?: string;

  @ApiProperty({ description: 'Is Active' })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: "Driver's status", enum: DriverStatus })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional({ description: 'Driver price per hour' })
  @IsNumber()
  @IsPositive()
  pricePerHour: number;

  @ApiPropertyOptional({ description: 'Profile Image URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  profileImg: string;

  @ApiPropertyOptional({ description: "Driver's Disabled" })
  @IsOptional()
  @IsString()
  @IsUrl()
  isDisable: boolean;

  @ApiProperty({
    description: "Shows the token of the user that's logged in",
  })
  @IsString()
  @IsOptional()
  loggedToken?: string;

  @ApiProperty({
    description: 'Shows the device where the user is logged in',
  })
  @IsString()
  @IsOptional()
  loggedDevice?: string;

  @ApiPropertyOptional({ description: 'Company', type: SimpleOwnerCompanyDTO })
  @IsOptional()
  @Type(() => SimpleOwnerCompanyDTO)
  @ValidateNested()
  drivingFor?: SimpleOwnerCompanyDTO;

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

  static fromModel(driver: Driver): DriverDTO {
    const {
      id,
      name,
      email,
      phoneNumber,
      profileImg,
      dateOfBirth,
      licenseNumber,
      medicalCard,
      LicenseBack,
      LicenseFront,
      isActive,
      pricePerHour,
      status,
      drivingFor,
      loggedToken,
      loggedDevice,
      isDisable,
      paymentMethod,
      paymentSubMethod,
      percent,
      licenseExpiredDate,
    } = driver;
    return {
      id,
      profileImg,
      name,
      email,
      phoneNumber,
      dateOfBirth,
      licenseNumber,
      medicalCard,
      LicenseBack,
      LicenseFront,
      isActive,
      pricePerHour,
      status,
      loggedToken,
      loggedDevice,
      isDisable,
      drivingFor: SimpleOwnerCompanyDTO.fromModel(drivingFor),
      paymentMethod,
      paymentSubMethod,
      percent,
      licenseExpiredDate,
    };
  }
}
