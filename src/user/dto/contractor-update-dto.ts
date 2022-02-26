import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Contractor } from '../contractor.model';

export class ContractorUpdateDTO {
  @ApiProperty({ readOnly: true })
  id: string;

  @ApiPropertyOptional({ description: "Contractor's name" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  name: string;

  @ApiPropertyOptional({ description: "Contractor's email address" })
  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: "Contractor's phone number" })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: "Contractor's profile image" })
  @IsOptional()
  @IsString()
  profileImg: string;

  @ApiPropertyOptional({ description: 'Verified by admin' })
  @IsOptional()
  @IsBoolean()
  verifiedByAdmin: boolean;

  @ApiPropertyOptional({ description: "Contractor's password" })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password: string;

  toModel?(): Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      password: this.password,
    };
  }
}
