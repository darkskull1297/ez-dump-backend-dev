import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetAs {
  @ApiProperty({ description: 'Email of the User to be set as Admin/Support' })
  @IsString()
  @IsEmail()
  email: string;
}
