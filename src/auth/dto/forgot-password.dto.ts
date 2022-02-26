import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDTO {
  @ApiProperty({ description: "User's email address", minLength: 8 })
  @IsString()
  email: string;
}
