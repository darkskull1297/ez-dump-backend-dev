import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class StripeBankAccountVerifyDTO {
  @ApiProperty({ description: 'First amount to check' })
  @IsNumber()
  @IsPositive()
  firstDepositAmount: number;

  @ApiProperty({ description: 'Second amount to check' })
  @IsNumber()
  @IsPositive()
  secondDepositAmount: number;
}
