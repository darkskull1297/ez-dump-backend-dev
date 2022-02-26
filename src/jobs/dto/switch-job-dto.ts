import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray } from 'class-validator';

export class SwitchJobDTO {
  @ApiProperty({ description: 'Truck ID' })
  @IsArray()
  assignationId: string[];

  @ApiProperty({ description: 'Final Job Id' })
  @IsString()
  finalJobId: string;
}
