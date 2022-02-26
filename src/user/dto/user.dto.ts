import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsUrl,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { User } from '../user.model';

export class UserDTO {
  @ApiPropertyOptional({ description: "User's id" })
  @IsOptional()
  @IsString()
  id?: string;

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

  @ApiPropertyOptional({ description: "Disable User's" })
  @IsOptional()
  @IsString()
  isDisable: boolean;

  @ApiPropertyOptional({ description: "User's short id", readOnly: true })
  @IsNumber()
  @IsOptional()
  shortid?: number;

  static fromModel(user: User): UserDTO {
    const {
      name,
      email,
      profileImg,
      phoneNumber,
      id,
      shortid,
      isDisable,
    } = user;
    return { name, email, profileImg, phoneNumber, id, shortid, isDisable };
  }
}
