import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { InsuranceDTO } from './insurance.dto';
import { CustomInsuranceDTO } from './custom-insurance.dto';
import { CompanyDTO } from './company.dto';
import { OwnerCompany } from '../owner-company.model';
import { CustomInsurance } from '../custom-insurance.model';
import { OwnerContact } from '../owner-contact.model';
import { LocationDTO } from '../../jobs/dto/location.dto';
import { ContactDTO } from './contact.dto';

export class OwnerCompanyDTO extends CompanyDTO {
  @ApiProperty({ description: "Company's job radius" })
  @IsNumber()
  @IsOptional()
  jobRadius: number;

  @ApiProperty({ description: "Company's form W9" })
  @IsString()
  @IsOptional()
  formW9: string;

  @ApiProperty({ description: "Company's DOT number" })
  @IsString()
  @IsOptional()
  DOTNumber: string;

  @ApiPropertyOptional({
    description: "Company's parking lot address",
    type: LocationDTO,
  })
  @IsOptional()
  @Type(() => LocationDTO)
  @ValidateNested()
  parkingLotAddress?: LocationDTO;

  @ApiPropertyOptional({ description: "Company's bank name and address" })
  @IsString()
  @IsOptional()
  bankNameAndAddress: string;

  @ApiProperty({ description: "Company's routing number" })
  @IsString()
  @IsOptional()
  routingNumber: string;

  @ApiProperty({ description: "Company's account number" })
  @IsString()
  @IsOptional()
  accountNumber: string;

  @ApiProperty({
    description: 'General liability insurance',
    type: InsuranceDTO,
  })
  @IsOptional()
  @Type(() => InsuranceDTO)
  generalLiabilityInsurance?: InsuranceDTO;

  @ApiProperty({ description: 'Auto liability insurance', type: InsuranceDTO })
  @IsOptional()
  @Type(() => InsuranceDTO)
  autoLiabilityInsurance?: InsuranceDTO;

  @ApiProperty({
    description: 'Workers compensations insurance',
    type: InsuranceDTO,
  })
  @IsOptional()
  @Type(() => InsuranceDTO)
  workersCompensationsInsurance?: InsuranceDTO;

  @ApiProperty({
    description: 'List of other insurances',
    type: [CustomInsuranceDTO],
  })
  @IsOptional()
  @Type(() => CustomInsuranceDTO)
  @IsArray()
  @ValidateNested({ each: true })
  customInsuranceList?: CustomInsuranceDTO[];

  toModel?(): Omit<OwnerCompany, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      jobRadius: this.jobRadius,
      formW9: this.formW9,
      DOTNumber: this.DOTNumber,
      parkingLotAddress: this.parkingLotAddress,
      bankNameAndAddress: this.bankNameAndAddress,
      routingNumber: this.routingNumber,
      accountNumber: this.accountNumber,
      generalLiabilityInsurance: this.generalLiabilityInsurance,
      autoLiabilityInsurance: this.autoLiabilityInsurance,
      workersCompensationsInsurance: this.workersCompensationsInsurance,
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
        contact?.toModel(),
      ) as OwnerContact[],
      customInsuranceList: this.customInsuranceList?.map(ins =>
        ins?.toModel(),
      ) as CustomInsurance[],
    };
  }

  static fromModel(company: OwnerCompany): OwnerCompanyDTO {
    const {
      companyCommon,
      jobRadius,
      formW9,
      DOTNumber,
      parkingLotAddress,
      bankNameAndAddress,
      routingNumber,
      accountNumber,
      generalLiabilityInsurance,
      autoLiabilityInsurance,
      workersCompensationsInsurance,
      customInsuranceList,
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
      contacts: contacts?.map(contact => ContactDTO.fromModel(contact)),
      jobRadius,
      formW9,
      DOTNumber,
      parkingLotAddress: LocationDTO.fromModel(parkingLotAddress),
      bankNameAndAddress,
      routingNumber,
      accountNumber,
      generalLiabilityInsurance: InsuranceDTO.fromModel(
        generalLiabilityInsurance,
      ),
      autoLiabilityInsurance: InsuranceDTO.fromModel(autoLiabilityInsurance),
      workersCompensationsInsurance: InsuranceDTO.fromModel(
        workersCompensationsInsurance,
      ),
      customInsuranceList: customInsuranceList?.map(customInsurance =>
        CustomInsuranceDTO.fromModel(customInsurance),
      ),
    };
  }
}
