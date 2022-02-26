import { IsString, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResendVerificationDTO {
  @ApiProperty({ description: 'Email address to send verification email to' })
  @IsString()
  @IsEmail()
  email: string;
}