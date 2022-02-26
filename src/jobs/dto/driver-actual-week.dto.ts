import {
  ValidateNested,
  IsInstance,
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserDTO } from '../../user/dto/user.dto';
import { JobAssignationDTO } from './job-assignation.dto';
import { TimeEntry } from '../../timer/time-entry.model';
import { TimeEntryDTO } from '../../timer/dto/time-entry.dto';
import { DriverDTO } from '../../user/dto/driver-dto';
import { Driver } from '../../user/driver.model';
import { JobAssignation } from '../job-assignation.model';
import { SimpleJobDTO } from './simple-job.dto';
import { Job } from '../job.model';

export class DriverActualWeekDTO {
  @ApiProperty({ description: 'Driver', type: UserDTO })
  @IsInstance(UserDTO)
  @ValidateNested()
  driver: UserDTO;

  @ApiProperty({ description: 'Job assignations', type: JobAssignationDTO })
  @Type(() => JobAssignationDTO)
  @ValidateNested()
  assignation: JobAssignationDTO;

  @ApiProperty({ description: 'Worked hours' })
  @IsString()
  workedHours: string;

  @ApiPropertyOptional({ description: 'Amount' })
  @IsNumber()
  amount?: number;

  @ApiProperty({ description: 'Time entries', type: [TimeEntryDTO] })
  @Type(() => TimeEntryDTO)
  @IsArray()
  @ValidateNested({ each: true })
  timeEntries: TimeEntryDTO[];

  @ApiPropertyOptional({ description: 'Job', type: SimpleJobDTO })
  @IsOptional()
  @Type(() => SimpleJobDTO)
  @ValidateNested()
  job?: SimpleJobDTO;

  @ApiPropertyOptional({ description: 'Comment' })
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Ticket number' })
  @IsString()
  ticketNumber?: string;

  @ApiPropertyOptional({ description: 'Ticket number' })
  @IsString()
  travelTime?: string;

  @ApiPropertyOptional({ description: 'Contractor travel time' })
  @IsOptional()
  travelTimeSupervisor?: number;

  @ApiProperty({ description: 'Is ticket paid' })
  isPaid: boolean;

  @ApiProperty({ description: 'Ticket ID' })
  @IsString()
  ticketId: string;

  @ApiProperty({ description: 'Date when ticket was paid' })
  @IsString()
  paidAt: string;

  @ApiProperty({ description: 'Invoice was paid with' })
  @IsString()
  paidWith: string;

  @ApiProperty({ description: 'Account number if it was paid with ACH' })
  @IsString()
  accountNumber: string;

  @ApiProperty({
    description: 'Order number for the check number or transfer ticket result',
  })
  @IsString()
  orderNumber: string;

  @ApiProperty({ description: 'Total hours from Worked Hours & Travel Time/Supervisor' })
  @IsOptional()
  @IsNumber()
  totalHours?: number;

  static fromModel(
    driver: Driver,
    assignation: JobAssignation,
    workedHours: string,
    amount: number,
    job: Job,
    timeEntries: TimeEntry[],
    comment: string,
    ticketNumber: string,
    isPaid: boolean,
    ticketId: string,
    paidAt: string,
    accountNumber: string,
    orderNumber: string,
    paidWith: string,
    travelTime?: string,
    travelTimeSupervisor?: number,
  ): DriverActualWeekDTO {
    const workedHoursAsNumber: any = roundWorkedHours(workedHours);
    const workedHoursAsString: any = roundWorkedHours(workedHours, true);
    const validateTravelTime = +((travelTime || '00:00').replace(':', '.'));
    const validateTravelTimeSupervisor = travelTimeSupervisor || 0;
    const sumTravelAndHours = convertTotalHours(
      validateTravelTime + validateTravelTimeSupervisor + workedHoursAsNumber
    );
    const totalAmount = sumTravelAndHours * driver.pricePerHour;

    return {
      driver: DriverDTO.fromModel(driver),
      assignation: JobAssignationDTO.fromModel(assignation),
      workedHours: workedHoursAsString,
      amount: totalAmount,
      job: SimpleJobDTO.fromModel(job),
      timeEntries: TimeEntryDTO.fromModels(timeEntries),
      comment,
      ticketNumber,
      travelTime,
      isPaid,
      ticketId,
      paidAt,
      accountNumber,
      orderNumber,
      paidWith,
      travelTimeSupervisor: validateTravelTimeSupervisor,
      totalHours: sumTravelAndHours,
    };
  }
}

function roundWorkedHours(workedHours: string, convertAsString = false) {
  const timeInSeconds = +workedHours * 3600;
  let hour: any = Math.floor(timeInSeconds / 3600);
  hour = hour < 10 ? `0${hour}` : hour;
  let minute: any = Math.floor((timeInSeconds / 60) % 60);
  minute = minute < 10 ? `0${minute}` : minute;
  if (!convertAsString) {
    return parseFloat(`${hour}.${minute}`);
  } else {
    return `${hour}:${minute}`;
  }
}

function convertTotalHours(totalHours: number) {
  const fixedTotalHours = totalHours.toFixed(2);
  const seconds = Math.max(0, getSecondsFromHHMMSS(`${fixedTotalHours}`));
  const time = toHHMMSS(seconds);
  const [str1, str2] = time.split(":");
  return parseFloat(`${str1}.${str2}`);
}

function getSecondsFromHHMMSS (value: string) {
  const [str1, str2, str3] = value.split(".");

  const val1 = Number(str1);
  const val2 = Number(str2);
  const val3 = Number(str3);

  if (!isNaN(val1) && isNaN(val2) && isNaN(val3)) {
    return val1;
  }

  if (!isNaN(val1) && !isNaN(val2) && isNaN(val3)) {
    return val1 * 60 + val2;
  }

  if (!isNaN(val1) && !isNaN(val2) && !isNaN(val3)) {
    return val1 * 60 * 60 + val2 * 60 + val3;
  }

  return 0;
};

function toHHMMSS(secs: number) {
  const secNum = parseInt(secs.toString(), 10);
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor(secNum / 60) % 60;
  const seconds = secNum % 60;

  return [hours, minutes, seconds]
    .map((val) => (val < 10 ? `0${val}` : val))
    .filter((val, index) => val !== "00" || index > 0)
    .join(":");
};
