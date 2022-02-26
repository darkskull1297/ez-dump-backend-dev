import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Driver } from '../driver.model';
import { IsSimpleDate } from '../../util/simple-date.validator';
import { DriverPaymentMethods } from '../driverPaymentMethods';

export class SimpleDriverDTO {
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
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Driver's phone number" })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Date of birth (DD-MM-YYYY)' })
  @IsString()
  @IsSimpleDate()
  dateOfBirth: string;

  @ApiProperty({ description: 'License number' })
  @IsString()
  licenseNumber: string;

  @ApiProperty({ description: 'Is Active' })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Driver price per hour' })
  @IsNumber()
  @IsPositive()
  pricePerHour: number;

  @ApiPropertyOptional({ description: 'Profile Image URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  profileImg?: string;

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

  static fromModel(driver: Driver): SimpleDriverDTO {
    const {
      id,
      name,
      email,
      phoneNumber,
      profileImg,
      dateOfBirth,
      licenseNumber,
      isActive,
      pricePerHour,
      paymentMethod,
      paymentSubMethod,
      percent,
    } = driver;
    return {
      id,
      profileImg,
      name,
      email,
      phoneNumber,
      dateOfBirth,
      licenseNumber,
      isActive,
      pricePerHour,
      paymentMethod,
      paymentSubMethod,
      percent,
    };
  }
}
