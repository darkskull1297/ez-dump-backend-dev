import {
  format,
  endOfMonth,
  parse,
  startOfMonth,
  endOfDay,
  startOfDay,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  addHours,
  addMinutes,
} from 'date-fns';
import { TimeEntry } from '../timer/time-entry.model';
import { TruckPunch } from '../trucks/truck-punch.model';

export const TIMESTAMP_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const MONTH_YEAR_FORMAT = 'MM-yyyy';
export const SIMPLE_DATE_FORMAT = 'dd-MM-yyyy';

export interface TotalTime {
  minutes: number;
  seconds: number;
  hours: number;
}

export const parseMonthYearStringToDate = (date: string): Date =>
  parse(date, MONTH_YEAR_FORMAT, new Date());
export const parseSimpleDateStringToDate = (date: string): Date =>
  parse(date, SIMPLE_DATE_FORMAT, new Date());
export const parseDateToTimestamp = (date: Date): string =>
  format(date, TIMESTAMP_FORMAT);

export const getEndOfMonth = (monthYearStr: string): string =>
  monthYearStr &&
  parseDateToTimestamp(endOfMonth(parseMonthYearStringToDate(monthYearStr)));
export const getStartOfMonth = (monthYearStr: string): string =>
  monthYearStr &&
  parseDateToTimestamp(startOfMonth(parseMonthYearStringToDate(monthYearStr)));

export const getEndOfDay = (date: Date): string =>
  parseDateToTimestamp(endOfDay(date));
export const getStartOfDay = (date: Date): string =>
  parseDateToTimestamp(startOfDay(date));

export const getRoundedHours = (entries: TimeEntry[]): number => {
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  // const travelTimeSupervisor =
  //   entries[0].driverJobInvoice &&
  //   entries[0].driverJobInvoice.travelTimeSupervisor &&
  //   entries[0].driverJobInvoice.travelTimeSupervisor > 0
  //     ? entries[0].driverJobInvoice.travelTimeSupervisor / 3600
  //     : 0;

  entries.forEach(entry => {
    const diffInHours = differenceInHours(entry.endDate, entry.startDate);
    entry.startDate = addHours(entry.startDate, diffInHours);
    const diffInMinutes = differenceInMinutes(entry.endDate, entry.startDate);
    entry.startDate = addMinutes(entry.startDate, diffInMinutes);
    const diffInSeconds = differenceInSeconds(entry.endDate, entry.startDate);
    seconds += diffInSeconds;
    minutes += diffInMinutes;
    hours += diffInHours;
  });

  minutes += Math.floor(seconds / 60);
  hours += Math.floor(minutes / 60);
  if (hours + minutes / 60 < 1) return 1;

  if (minutes >= 53) {
    minutes = 0;
    hours += 1;
  } else {
    minutes = Math.round(minutes / 15) * 15;
  }

  console.info('Resulting hours and minutes: ', hours, minutes);

  return hours + minutes / 60;
};

export const getRoundedHoursFromPunchs = (punchs: TruckPunch[]): number => {
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  punchs.forEach(punch => {
    let punchIn = new Date(punch.punchIn);
    const punchOut = new Date(punch.punchOut);
    const diffInHours = differenceInHours(punchOut, punchIn);
    punchIn = addHours(punchIn, diffInHours);
    const diffInMinutes = differenceInMinutes(punchOut, punchIn);
    punchIn = addMinutes(punchIn, diffInMinutes);
    const diffInSeconds = differenceInSeconds(punchOut, punchIn);
    seconds += diffInSeconds;
    minutes += diffInMinutes;
    hours += diffInHours;
  });

  minutes += Math.floor(seconds / 60);
  hours += Math.floor(minutes / 60);
  if (hours + minutes / 60 < 1) return 1;
  return hours + minutes / 60;
};

export const getNotRoundedHours = (entries: TimeEntry[]): TotalTime => {
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  entries.forEach(entry => {
    const diffInHours = differenceInHours(entry.endDate, entry.startDate);
    entry.startDate = addHours(entry.startDate, diffInHours);
    const diffInMinutes = differenceInMinutes(entry.endDate, entry.startDate);
    entry.startDate = addMinutes(entry.startDate, diffInMinutes);
    const diffInSeconds = differenceInSeconds(entry.endDate, entry.startDate);

    seconds += diffInSeconds;
    minutes += diffInMinutes;
    hours += diffInHours;
  });

  minutes += Math.floor(seconds / 60);
  hours += Math.floor(minutes / 60);
  return {
    minutes,
    hours,
    seconds,
  };
};
