import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { RegisterDTO } from './register.dto';
import { ContractorCompanyDTO } from '../../company/dto/contractor-company.dto';
import { Contractor } from '../../user/contractor.model';
import { ContractorCompany } from '../../company/contractor-company.model';

export class RegisterContractorDTO extends RegisterDTO {
  @ApiProperty({ description: 'Company', type: ContractorCompanyDTO })
  @Type(() => ContractorCompanyDTO)
  @ValidateNested()
  company: ContractorCompanyDTO;

  toModel?(): Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      password: this.password,
      company: this.company.toModel() as ContractorCompany,
    };
  }
}
