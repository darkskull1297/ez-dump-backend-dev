import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CompanyDTO } from './company.dto';
import { OwnerCompany } from '../owner-company.model';
import { LocationDTO } from '../../jobs/dto/location.dto';
import { ContactDTO } from './contact.dto';

export class SimpleOwnerCompanyDTO extends CompanyDTO {
  @ApiProperty({ description: "Company's job radius" })
  @IsNumber()
  jobRadius: number;

  @ApiProperty({ description: "Company's form W9" })
  @IsString()
  formW9: string;

  @ApiProperty({ description: "Company's DOT number" })
  @IsString()
  DOTNumber: string;

  @ApiPropertyOptional({
    description: "Company's parking lot address",
    type: LocationDTO,
  })
  @IsOptional()
  @Type(() => LocationDTO)
  @ValidateNested()
  parkingLotAddress?: LocationDTO;

  static fromModel(company: OwnerCompany): SimpleOwnerCompanyDTO {
    const {
      companyCommon,
      jobRadius,
      formW9,
      DOTNumber,
      parkingLotAddress,
      contacts,
    } = company;
    return {
      name: companyCommon.name,
      logo: companyCommon.logo,
      entityType: companyCommon.entityType,
      EINNumber: companyCommon.EINNumber,
      address: LocationDTO.fromModel(companyCommon.address),
      fax: companyCommon.fax,
      officePhoneNumber: companyCommon.officePhoneNumber,
      contacts: contacts.map(contact => ContactDTO.fromModel(contact)),
      jobRadius,
      formW9,
      DOTNumber,
      parkingLotAddress: LocationDTO.fromModel(parkingLotAddress),
    };
  }
}
