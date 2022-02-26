import { Controller, UseGuards, Get, Query, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import moment from 'moment';

import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole } from '../../../user/user.model';
import { PaginationDTO } from '../../../common/pagination.dto';
import { DriverJobInvoiceService } from '../../driver-job-invoice.service';
import { DriverWeeklyInvoiceDTO } from '../../dto/driver-weekly-invoice.dto';
import { CurrentUser } from '../../../user/current-user.decorator';
import { Driver } from '../../../user/driver.model';
import { DriverActualWeekDTO } from '../../../jobs/dto/driver-actual-week.dto';

@ApiUnauthorizedResponse({
  description: 'Invalid token',
  type: FailureStringResponse,
})
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard(), HasRole(UserRole.DRIVER))
@ApiTags('invoices')
@Controller('driver/invoices')
export class InvoiceDriverController {
  constructor(private readonly driverInvoiceService: DriverJobInvoiceService) {}

  @ApiOperation({ summary: 'Get weekly invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Weekly Invoices',
    type: DriverWeeklyInvoiceDTO,
    isArray: true,
  })
  @Get()
  async list(
    @CurrentUser() driver: Driver,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<DriverWeeklyInvoiceDTO[]> {
    const invoices = await this.driverInvoiceService.getWeeklyInvoicesForDriver(
      driver,
      {
        skip,
        count,
      },
    );
    return invoices.map(invoice => DriverWeeklyInvoiceDTO.fromModel(invoice));
  }

  @ApiOperation({ summary: 'Get next scheduled job' })
  @ApiOkResponse({
    description: 'Next scheduled Job',
    type: DriverActualWeekDTO,
  })
  @Get('week-work/:month')
  async getActualWeekWork(
    @Param('month') date: string,
      @CurrentUser() driver: Driver,
  ): Promise<any[]> {
    console.info('Month: ', date);
    const firstWeekday = moment(date)
      .startOf('month')
      .format('YYYY-MM-DD');
    const lastWeekday = moment(date)
      .endOf('month')
      .format('YYYY-MM-DD');

    const scheduledJobs = await this.driverInvoiceService.getDriverWeekWorkById(
      driver.id,
      firstWeekday,
      lastWeekday,
    );

    const actualWeekSummary = await this.driverInvoiceService.makeActualWeekListForDriver(
      driver,
      scheduledJobs,
      date,
    );

    actualWeekSummary.forEach((weekSumary, index, arr) => {
      const resultingSummary = weekSumary.weekWork.map(actualWork => {
        const {
          assignation,
          workedHours,
          amount,
          entries,
          job,
          comment,
          ticketNumber,
          travelTime,
          isPaid,
          ticketId,
          paidAt,
          orderNumber,
          accountNumber,
          paidWith,
          travelTimeSupervisor,
        } = actualWork;

        return DriverActualWeekDTO.fromModel(
          driver as Driver,
          assignation,
          workedHours,
          amount,
          job,
          entries,
          comment,
          ticketNumber,
          isPaid,
          ticketId,
          paidAt,
          accountNumber,
          orderNumber,
          paidWith,
          travelTime,
          travelTimeSupervisor,
        ) as any;
      });

      arr[index].weekWork = resultingSummary;
    });

    return actualWeekSummary;
  }
}
