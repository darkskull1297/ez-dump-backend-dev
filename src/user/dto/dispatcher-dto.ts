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
import { Dispatcher } from '../dispatcher.model';
import { ContractorCompanyDTO } from '../../company/dto/contractor-company.dto';

export class DispatcherDTO {
  @ApiPropertyOptional({ description: "User's id", readOnly: true })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: "Dispatcher's name",
    minLength: 3,
    maxLength: 32,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
  name: string;

  @ApiProperty({ description: "Dispatcher's email address" })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Dispatcher's phone number" })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: "Shows whether Dispatcher is disabled, restricted or active",
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description:
      "Shows if the user is logged in, and the device where it's logged",
  })
  @IsString()
  @IsOptional()
  loggedDevice?: string;

  @ApiProperty({
    description: "Shows the token of the user that's logged in",
  })
  @IsString()
  @IsOptional()
  loggedToken?: string;

  @ApiPropertyOptional({ description: 'Contractor company' })
  @Type(() => ContractorCompanyDTO)
  @ValidateNested()
  @IsOptional()
  @IsInstance(ContractorCompanyDTO)
  contractorCompany?: ContractorCompanyDTO;

  static async fromModel(dispatcher: Dispatcher): Promise<DispatcherDTO> {
    const {
      id,
      name,
      email,
      phoneNumber,
      isDisable,
      isRestricted,
      contractorCompany,
      loggedToken,
      loggedDevice,
    } = dispatcher;

    let status = isRestricted
      ? 'Restricted'
      : isDisable
      ? 'Disabled'
      : 'Active';

    return {
      id,
      name,
      email,
      phoneNumber,
      status,
      loggedToken,
      loggedDevice,
      contractorCompany: await ContractorCompanyDTO.fromModel(
        contractorCompany,
      ),
    };
  }
}
