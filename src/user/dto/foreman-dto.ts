import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  ValidateNested,
  IsInstance,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Foreman } from '../foreman.model';
import { ContractorCompanyDTO } from '../../company/dto/contractor-company.dto';

export class ForemanDTO {
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

  @ApiProperty({ description: "Contractors's email address" })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Contractors's phone number" })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Contractor company' })
  @Type(() => ContractorCompanyDTO)
  @ValidateNested()
  @IsInstance(ContractorCompanyDTO)
  @IsOptional()
  contractorCompany?: ContractorCompanyDTO;

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

  static async fromModel(foreman: Foreman): Promise<ForemanDTO> {
    const {
      id,
      name,
      email,
      phoneNumber,
      contractorCompany,
      loggedDevice,
      loggedToken,
    } = foreman;
    return {
      id,
      name,
      email,
      phoneNumber,
      loggedDevice,
      loggedToken,
      contractorCompany: await ContractorCompanyDTO.fromModel(
        contractorCompany,
      ),
    };
  }
}
