import {
  IsBoolean,
  IsEmail,
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
import { Contractor } from '../contractor.model';
import { ContractorCompanyDTO } from '../../company/dto/contractor-company.dto';

export class ContractorDTO {
  @ApiPropertyOptional({ description: "User's id" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: "Contractor's name",
    minLength: 3,
    maxLength: 32,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
  name: string;

  @ApiPropertyOptional({ description: "Contractor's status" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: "Contractor's email address" })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Contractor's phone number" })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: "Contractor's profile image" })
  @IsString()
  profileImg?: string;

  @ApiProperty({ description: "Contractor's is verified by admin" })
  @IsBoolean()
  verifiedByAdmin?: boolean;

  // @ApiProperty({ description: "Contractor's discount" })
  // @IsBoolean()
  // hasDiscount?: boolean;

  @ApiProperty({ description: 'Contractor is logged in' })
  @IsString()
  @IsOptional()
  loggedDevice?: string;

  @ApiProperty({
    description: "Shows the token of the user that's logged in",
  })
  @IsString()
  @IsOptional()
  loggedToken?: string;

  @ApiProperty({ description: 'Company', type: OwnerCompanyDTO })
  @Type(() => ContractorCompanyDTO)
  @ValidateNested()
  company?: ContractorCompanyDTO;

  @ApiProperty({
    description: 'Associated User',
  })
  @IsString()
  @IsOptional()
  associatedUserId?: string;

  static async fromModel(contractor: Contractor): Promise<ContractorDTO> {
    const {
      id,
      name,
      isDisable,
      isRestricted,
      email,
      phoneNumber,
      profileImg,
      verifiedByAdmin,
      company,
      loggedToken,
      loggedDevice,
      associatedUserId,
      // hasDiscount,
    } = contractor;

    let status = isRestricted
      ? 'Restricted'
      : isDisable
      ? 'Disabled'
      : 'Active';

    return {
      id,
      name,
      status,
      email,
      phoneNumber,
      profileImg,
      verifiedByAdmin,
      loggedToken,
      loggedDevice,
      associatedUserId,
      // hasDiscount,
      company: company ? await ContractorCompanyDTO.fromModel(company) : null,
    };
  }
}
