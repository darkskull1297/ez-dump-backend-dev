import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  // ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../user.model';

export class OwnerUpdateDTO {
  @ApiPropertyOptional({ description: "Owner's name" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  name: string;

  @ApiPropertyOptional({ description: "Owner's email address" })
  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: "Owner's phone number" })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: "Owner's profile image" })
  @IsOptional()
  @IsString()
  profileImg: string;

  @ApiPropertyOptional({ description: 'Verified by admin' })
  @IsOptional()
  @IsBoolean()
  verifiedByAdmin: boolean;

  @ApiPropertyOptional({ description: "Owner's password" })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ readOnly: true })
  id: string;

  toModel?(): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      password: this.password,
    };
  }
}
