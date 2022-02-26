import {
  IsEmail,
  IsInstance,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Customer } from '../customer.model';
import { LocationDTO } from '../../jobs/dto/location.dto';
import { ContractorDTO } from '../../user/dto/contractor-dto';

export class CustomerDto {
  @ApiPropertyOptional({ description: "Customer's name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Customer's contact" })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ description: "Customer's phone" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: "User's id", readOnly: true })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: "Customer's address" })
  @Type(() => LocationDTO)
  @ValidateNested()
  @IsInstance(LocationDTO)
  address?: LocationDTO;

  @ApiProperty({ description: "Job's contractor", readOnly: true })
  @Type(() => ContractorDTO)
  contractor?: ContractorDTO;

  toModel?(): Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'contractor'> {
    return {
      name: this.name,
      contact: this.contact,
      address: this.address,
      phoneNumber: this.phoneNumber,
    };
  }

  static fromModel(customer: Customer): CustomerDto {
    const { name, contact, address, phoneNumber, id } = customer;
    return {
      id,
      name,
      contact,
      address,
      phoneNumber,
    };
  }
}
