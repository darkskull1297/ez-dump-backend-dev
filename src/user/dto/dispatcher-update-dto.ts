import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { Dispatcher } from '../dispatcher.model';

export class DispatcherUpdateDTO {
  @ApiPropertyOptional({
    description: "Contractor's name",
    minLength: 3,
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
  name: string;

  @ApiPropertyOptional({ description: "Dispatcher's email address" })
  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: "Dispatcher's phone number" })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: "Dispatcher's password" })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ readOnly: true })
  id: string;

  toModel?(): Omit<Dispatcher, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      password: this.password,
      //   contractorCompany: this.contractorCompany.toModel() as ContractorCompany,
    };
  }
}
