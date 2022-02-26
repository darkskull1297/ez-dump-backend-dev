import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsDate,
  IsInstance,
  ValidateNested,
} from 'class-validator';
import { UserDTO } from '../../user/dto/user.dto';
import { TimeEntry } from '../time-entry.model';

export class TimeEntryWithDriverDTO {
  @ApiProperty({ description: 'Start date' })
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ description: 'Driver', type: UserDTO })
  @IsInstance(UserDTO)
  @ValidateNested()
  @IsOptional()
  user: UserDTO;

  static fromModel(timeEntry: TimeEntry): TimeEntryWithDriverDTO {
    const { startDate, endDate, user } = timeEntry;
    return { startDate, endDate, user: UserDTO.fromModel(user) };
  }

  static fromModels(timeEntries: TimeEntry[]): TimeEntryWithDriverDTO[] {
    return timeEntries
      .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
      .map(timeEntry => TimeEntryWithDriverDTO.fromModel(timeEntry));
  }
}
