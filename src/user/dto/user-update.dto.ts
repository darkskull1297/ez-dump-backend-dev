import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsUrl,
  IsOptional,
} from 'class-validator';
import { User } from '../user.model';

export class UpdateUserDTO {
  @ApiPropertyOptional({
    description: "User's name",
    minLength: 3,
    maxLength: 32,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
  name: string;

  @ApiPropertyOptional({ description: "User's email address" })
  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Profile Image URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  profileImg: string;

  @ApiPropertyOptional({ description: "User's phone number" })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'New device id to be used for notifications',
  })
  @IsOptional()
  deviceID: string;

  toModel(): Omit<
  User,
  'id' | 'createdAt' | 'updatedAt' | 'role' | 'password' | 'deviceID'
  > {
    return {
      name: this.name,
      email: this.email,
      profileImg: this.profileImg,
      phoneNumber: this.phoneNumber,
    };
  }
}
