import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDTO {
  @ApiProperty({ description: "User's name", minLength: 3, maxLength: 32 })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
  name: string;

  @ApiProperty({ description: "User's email address" })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Driver's phone number" })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: "User's password", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
