import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsEmail,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Foreman } from '../foreman.model';
import { ContractorCompanyDTO } from '../../company/dto/contractor-company.dto';

export class ForemanUpdateDTO {
  @ApiPropertyOptional({ readOnly: true })
  id: string;

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

  @ApiPropertyOptional({ description: "Foreman's email address" })
  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: "Foreman's password" })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: "Foreman's phone number" })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  toModel?(): Omit<Foreman, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      password: this.password,
    };
  }
}
