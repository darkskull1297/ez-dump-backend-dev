import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDTO {
  @ApiPropertyOptional({ description: "User's old password", minLength: 8 })
  @IsString()
  @IsOptional()
  @MinLength(8)
  oldPassword?: string;

  @ApiProperty({ description: "User's new password", minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
