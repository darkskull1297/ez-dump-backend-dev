import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { OwnerCompanyDTO } from '../../company/dto/owner-company.dto';
import { Owner } from '../owner.model';
import { OwnerPriority } from '../owner-priority';

export class OwnerDTO {
  @ApiPropertyOptional({ description: "User's id" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: "Owner's name", minLength: 3, maxLength: 32 })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
  name: string;

  @ApiPropertyOptional({ description: "Owner's status" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: "Owner's email address" })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Owner's phone number" })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: "Owner's profile image" })
  @IsString()
  profileImg?: string;

  @ApiProperty({ description: "Owner's is verified by admin" })
  @IsBoolean()
  verifiedByAdmin?: boolean;

  @ApiProperty({ description: 'Company', type: OwnerCompanyDTO })
  @Type(() => OwnerCompanyDTO)
  @ValidateNested()
  company?: OwnerCompanyDTO;

  @ApiPropertyOptional({ description: "Job's commodity", enum: OwnerPriority })
  @IsEnum(OwnerPriority)
  @IsOptional()
  priority: OwnerPriority;

  @ApiProperty({
    description: "Shows the token of the user that's logged in",
  })
  @IsString()
  @IsOptional()
  loggedToken?: string;

  @ApiProperty({
    description:
      "Shows if the user is logged in, and the device where it's logged",
  })
  @IsString()
  @IsOptional()
  loggedDevice?: string;

  @ApiProperty({ description: "Owner's company" })
  @IsString()
  companyCommonName: string;

  // @ApiProperty({ description: "Owner's discount" })
  // @IsBoolean()
  // hasDiscount?: boolean;

  static fromModel(owner: any): OwnerDTO {
    const {
      id,
      name,
      isDisable,
      isRestricted,
      email,
      phoneNumber,
      profileImg,
      verifiedByAdmin,
      priority,
      companyCommonName,
      loggedToken,
      loggedDevice,
      // hasDiscount,
    } = owner;

    let status = isRestricted
      ? 'Restricted'
      : isDisable
      ? 'Disabled'
      : 'Active';

    return {
      id,
      companyCommonName,
      name,
      status,
      email,
      phoneNumber,
      profileImg,
      verifiedByAdmin,
      priority,
      loggedToken,
      loggedDevice,
      // hasDiscount,
    };
  }
}
