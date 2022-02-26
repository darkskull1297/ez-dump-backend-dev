import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAs {
  @ApiProperty({ description: 'Email of the User to get an account' })
  @IsString()
  @IsEmail()
  email: string;
}
