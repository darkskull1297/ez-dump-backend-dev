import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDate } from 'class-validator';
import { TimeEntry } from '../time-entry.model';

export class TimeEntryDTO {
  @ApiProperty({ description: 'Start date' })
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDate()
  endDate: Date;

  static fromModel(timeEntry: TimeEntry): TimeEntryDTO {
    const { startDate, endDate } = timeEntry;
    return { startDate, endDate };
  }

  static fromModels(timeEntries: TimeEntry[]): TimeEntryDTO[] {
    return timeEntries
      .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
      .map(timeEntry => TimeEntryDTO.fromModel(timeEntry));
  }
}
