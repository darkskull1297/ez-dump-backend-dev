import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { RegisterDTO } from './register.dto';
import { OwnerCompanyDTO } from '../../company/dto/owner-company.dto';
import { Owner } from '../../user/owner.model';
import { OwnerCompany } from '../../company/owner-company.model';

export class RegisterOwnerDTO extends RegisterDTO {
  @ApiProperty({ description: 'Company', type: OwnerCompanyDTO })
  @Type(() => OwnerCompanyDTO)
  @ValidateNested()
  company: OwnerCompanyDTO;

  toModel?(): Omit<Owner, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      password: this.password,
      company: Promise.resolve(this.company.toModel() as OwnerCompany),
    };
  }
}
