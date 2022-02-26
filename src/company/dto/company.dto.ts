import {
  IsArray,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { ContactDTO } from './contact.dto';
import { LocationDTO } from '../../jobs/dto/location.dto';

export class CompanyDTO {
  @ApiProperty({ description: 'Company name' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Company logo' })
  @IsOptional()
  @IsString()
  logo: string;

  @ApiProperty({ description: "Company's entity type" })
  @IsOptional()
  @IsString()
  entityType: string;

  @ApiProperty({ description: "Company's EIN number" })
  @IsOptional()
  @IsString()
  EINNumber: string;

  @ApiProperty({ description: "Company's address", type: LocationDTO })
  @IsOptional()
  @Type(() => LocationDTO)
  @ValidateNested()
  address: LocationDTO;

  @ApiProperty({ description: "Company's fax" })
  @IsOptional()
  @IsString()
  fax: string;

  @ApiProperty({ description: "Company's office phone number" })
  @IsOptional()
  @IsString()
  officePhoneNumber: string;

  @ApiProperty({ description: 'Contacts', type: [ContactDTO] })
  @IsOptional()
  @Type(() => ContactDTO)
  @IsArray()
  @ValidateNested({ each: true })
  contacts: ContactDTO[];
}
