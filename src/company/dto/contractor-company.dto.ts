import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { CompanyDTO } from './company.dto';
import { ContractorContact } from '../contractor-contact.model';
import { ContractorCompany } from '../contractor-company.model';
import { ContactDTO } from './contact.dto';
import { LocationDTO } from '../../jobs/dto/location.dto';
import { UserDTO } from '../../user/dto/user.dto';

export class ContractorCompanyDTO extends CompanyDTO {
  @ApiProperty({ description: 'List of needed insurance' })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  insuranceNeeded: string[];

  @ApiProperty({ description: 'List of cities' })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  cities: string[];

  @ApiPropertyOptional({ description: 'Contractor' })
  @IsOptional()
  @Type(() => UserDTO)
  @ValidateNested()
  contractor?: UserDTO;

  toModel?(): Omit<ContractorCompany, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      insuranceNeeded: this.insuranceNeeded,
      cities: this.cities,
      companyCommon: {
        name: this.name,
        logo: this.logo,
        entityType: this.entityType,
        EINNumber: this.EINNumber,
        address: this.address?.toModel(),
        fax: this.fax,
        officePhoneNumber: this.officePhoneNumber,
      },
      contacts: this.contacts?.map(contact =>
        contact.toModel(),
      ) as ContractorContact[],
    };
  }

  static async fromModel(
    company: ContractorCompany,
  ): Promise<ContractorCompanyDTO> {
    const { companyCommon, contacts, insuranceNeeded, cities } = company;
    const contractor = await company.contractor;
    return {
      name: companyCommon.name,
      logo: companyCommon.logo,
      entityType: companyCommon.entityType,
      EINNumber: companyCommon.EINNumber,
      fax: companyCommon.fax,
      officePhoneNumber: companyCommon.officePhoneNumber,
      address: LocationDTO.fromModel(companyCommon.address),
      contacts: contacts?.map(contact => ContactDTO.fromModel(contact)) || [],
      cities,
      insuranceNeeded,
      contractor: contractor ? UserDTO.fromModel(contractor) : null,
    } as ContractorCompanyDTO;
  }
}
