import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsUrl,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { User, UserRole } from '../user.model';

export class UserMeDTO {
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

  @ApiPropertyOptional({ description: 'User verified by admin' })
  @IsOptional()
  @IsBoolean()
  verifiedByAdmin?: boolean;

  @ApiPropertyOptional({ description: 'User role', enum: UserRole })
  @IsEnum(UserRole)
  role?: UserRole;

  static fromModel(user: User, verifiedByAdmin: boolean): UserMeDTO {
    const { name, email, profileImg, phoneNumber, id, role } = user;
    return { name, email, profileImg, phoneNumber, id, role, verifiedByAdmin };
  }
}
