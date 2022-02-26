import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDTO {
  @ApiProperty({ description: "User's email address" })
  @IsString()
  @IsEmail()
  email: string;
}
