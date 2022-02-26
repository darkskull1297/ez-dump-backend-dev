import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OwnerPriority } from '../owner-priority';

export class OwnerPriorityDTO {
  @ApiProperty({ description: 'Priority', enum: OwnerPriority })
  @IsEnum(OwnerPriority)
  priority: OwnerPriority;
}
