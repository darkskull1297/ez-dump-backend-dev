import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsDate,
  IsInstance,
  ValidateNested,
} from 'class-validator';
import { SimpleDriverJobInvoiceDTO } from '../../invoices/dto/simple-driver-job-invoice.dto';
import { SimpleJobDTO } from '../../jobs/dto/simple-job.dto';
import { TruckDTO } from '../../trucks/dto/truck.dto';
import { TimeEntry } from '../time-entry.model';

export class TimeEntryWithInvoiceDTO {
  @ApiProperty({ description: 'Start date' })
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Driver job invoice',
    type: SimpleDriverJobInvoiceDTO,
  })
  @IsOptional()
  @IsInstance(SimpleDriverJobInvoiceDTO)
  @ValidateNested()
  driverJobInvoice: SimpleDriverJobInvoiceDTO;

  @ApiPropertyOptional({ description: 'Time entry job', type: SimpleJobDTO })
  @IsOptional()
  @IsInstance(SimpleJobDTO)
  @ValidateNested()
  job: SimpleJobDTO;

  @ApiProperty({
    description: 'Trucks',
    type: [TruckDTO],
  })
  @ValidateNested({ each: true })
  @IsOptional()
  truck: TruckDTO;

  static fromModel(timeEntry: TimeEntry): TimeEntryWithInvoiceDTO {
    const { startDate, endDate, driverJobInvoice, job, truck } = timeEntry;

    return {
      startDate,
      endDate,
      driverJobInvoice: driverJobInvoice
        ? SimpleDriverJobInvoiceDTO.fromModel(driverJobInvoice)
        : null,
      job: SimpleJobDTO.fromModel(job),
      truck: TruckDTO.fromModel(truck),
    };
  }

  static fromModels(timeEntries: TimeEntry[]): TimeEntryWithInvoiceDTO[] {
    return timeEntries
      .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
      .map(timeEntry => TimeEntryWithInvoiceDTO.fromModel(timeEntry));
  }
}
