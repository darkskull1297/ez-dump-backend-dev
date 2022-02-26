import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { LocationDTO } from './location.dto';

export enum SwitchStatus {
  ACCEPTED = 'ACCEPTED',
  DENIED = 'DENIED',
  REQUESTED = 'REQUESTED',
  FINISHED = 'FINISHED',
  NOT_REQUESTED = 'NOT_REQUESTED',
}
export class SwitchRequestDTO {
  @ApiProperty({ description: 'Switch ID' })
  @IsString()
  switchId: string;

  @ApiProperty({ description: 'Final Job ID' })
  @IsString()
  desition: SwitchStatus;

  @ApiProperty({ description: 'Final Job ID' })
  @IsOptional()
  location?: LocationDTO;
}
