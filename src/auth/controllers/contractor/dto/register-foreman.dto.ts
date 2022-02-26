import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Foreman } from '../../../../user/foreman.model';

export class RegisterForemanDTO {
  @ApiProperty({
    description: "foremans's name",
    minLength: 3,
    maxLength: 32,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
  name: string;

  @ApiProperty({ description: "Foreman's email address" })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Foreman's phone number" })
  @IsString()
  phoneNumber: string;

  toModel?(): Omit<Foreman, 'id' | 'updatedAt' | 'createdAt' | 'password'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
    };
  }
}
