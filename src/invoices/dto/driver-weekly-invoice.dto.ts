import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  ValidateNested,
  IsBoolean,
  IsDate,
  IsOptional,
} from 'class-validator';
import { SimpleJobDTO } from '../../jobs/dto/simple-job.dto';
import { TimeEntryWithInvoiceDTO } from '../../timer/dto/time-entry-with-invoice.dto';
import { TruckPunch } from '../../trucks/truck-punch.model';
import { UserDTO } from '../../user/dto/user.dto';
import { DriverWeeklyInvoice } from '../driver-weekly-invoice.model';

export class DriverWeeklyInvoiceDTO {
  @ApiProperty({ description: 'Invoice id' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Invoice amount to pay' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Is invoice paid?' })
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty({ description: 'Hours worked' })
  @IsNumber()
  hours: number;

  @ApiProperty({ description: 'Driver', type: UserDTO })
  @Type(() => UserDTO)
  @ValidateNested()
  driver: UserDTO;

  @ApiProperty({
    description: 'Jobs',
    type: [SimpleJobDTO],
  })
  @Type(() => SimpleJobDTO)
  @ValidateNested({ each: true })
  jobs: SimpleJobDTO[];

  @ApiProperty({
    description: 'Driver week time entries',
    type: [TimeEntryWithInvoiceDTO],
  })
  @Type(() => TimeEntryWithInvoiceDTO)
  @ValidateNested({ each: true })
  timeEntries: TimeEntryWithInvoiceDTO[];

  @ApiPropertyOptional({ description: 'Invoice start date' })
  @IsOptional()
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional({ description: 'Invoice end date' })
  @IsOptional()
  @IsDate()
  endDate: Date;

  @ApiProperty({
    description: 'Driver week time entries',
    type: [TruckPunch],
  })
  @Type(() => TruckPunch)
  @ValidateNested({ each: true })
  truckPunchs: TruckPunch[];

  static fromModel(invoice: DriverWeeklyInvoice): DriverWeeklyInvoiceDTO {
    const {
      id,
      amount,
      hours,
      driver,
      jobs,
      timeEntries,
      isPaid,
      startDate,
      endDate,
      truckPunchs,
    } = invoice;

    let totalTravelTime = 0;

    const entriesWithDriver = timeEntries.map(entry => {
      const validateTravelTime = (
        entry.driverJobInvoice?.travelTime || '00:00'
      ).split(':');
      const travelTimeMinutes = Number(validateTravelTime[1]);
      const travelTimeHours =
        Number(validateTravelTime[0]) +
        Math.floor(Number(travelTimeMinutes) / 60);
      const resultingTravelTime = travelTimeHours + travelTimeMinutes / 60;

      const travelTimeInHours = resultingTravelTime / 60;
      const sumTravelAndHours =
        travelTimeInHours + (entry.driverJobInvoice?.hours || 1);
      const totalAmount = sumTravelAndHours * driver.pricePerHour;

      totalTravelTime += resultingTravelTime;

      return {
        ...entry,
        driverJobInvoice: { ...entry.driverJobInvoice, amount: totalAmount },
      };
    });

    const pricePerHour = amount / hours;

    const totalWeeklyAmount = (hours + totalTravelTime / 60) * pricePerHour;
    // console.log('jobs',jobs);

    return {
      id,
      amount: totalWeeklyAmount,
      isPaid,
      hours,
      driver: UserDTO.fromModel(driver),
      jobs: jobs.map(Job => SimpleJobDTO.fromModel(Job)),
      timeEntries: TimeEntryWithInvoiceDTO.fromModels(entriesWithDriver),
      startDate,
      endDate,
      truckPunchs,
    };
  }
}

export class DriverWeeklyInvoicesDTO {
  @ApiProperty({ description: 'Id of driver', type: String })
  id: string;

  @ApiProperty({ description: 'Name of driver', type: String })
  name: string;

  @ApiProperty({
    description: 'Last invoice',
    type: DriverWeeklyInvoiceDTO,
  })
  lastInvoice: DriverWeeklyInvoiceDTO;

  @ApiProperty({
    description: 'current invoice',
    type: DriverWeeklyInvoice,
  })
  currentInvoice: DriverWeeklyInvoice;
}
