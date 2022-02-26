import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
  @ApiProperty({ description: "User's email address" })
  @IsString()
  email: string;

  @ApiProperty({ description: "User's password", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
