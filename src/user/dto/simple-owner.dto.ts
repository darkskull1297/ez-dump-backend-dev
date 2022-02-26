import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsUrl,
  IsPhoneNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Owner } from '../owner.model';

export class SimpleOwnerDTO {
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
  @IsPhoneNumber('ZZ')
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Stripe account completed' })
  @IsOptional()
  @IsBoolean()
  completedStripeAccount: boolean;

  @ApiPropertyOptional({ description: 'Associated User' })
  @IsString()
  @IsOptional()
  associatedUserId?: string;

  static fromModel(user: Owner): SimpleOwnerDTO {
    const {
      name,
      email,
      profileImg,
      phoneNumber,
      id,
      completedStripeAccount,
      associatedUserId,
    } = user;
    return {
      name,
      email,
      profileImg,
      phoneNumber,
      id,
      completedStripeAccount,
      associatedUserId,
    };
  }
}
