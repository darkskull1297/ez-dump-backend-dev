import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Dispatcher } from '../../../../user/dispatcher.model';

export class RegisterDispatcherDTO {
  @ApiProperty({
    description: "Dispatcher's name",
    minLength: 3,
    maxLength: 32,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[^{}<>[\]]+$/)
  name: string;

  @ApiProperty({ description: "Dispatcher's email address" })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Dispatcher's phone number" })
  @IsString()
  phoneNumber: string;

  toModel?(): Omit<Dispatcher, 'id' | 'updatedAt' | 'createdAt' | 'password'> {
    return {
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
    };
  }
}
