import {
  Controller,
  UseGuards,
  Get,
  Query,
  Patch,
  Body,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiQuery,
  ApiOkResponse,
  ApiAcceptedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole, User } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { JobsService } from '../../jobs.service';
import { DriverScheduledJobsQueryDTO } from '../../dto/driver-scheduled-jobs-query.dto';
import { DriverScheduledJobDTO } from '../../dto/driver-scheduled-job.dto';
import { DriverActualWeekDTO } from '../../dto/driver-actual-week.dto';
import { Driver } from '../../../user/driver.model';
import { JobAssignation } from '../../job-assignation.model';
import { SwitchRequestDTO } from '../../dto/switch-request-dto';
import { Job } from '../../job.model';

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
@ApiTags('jobs')
@Controller('driver/jobs')
export class JobDriverController {
  constructor(private readonly jobService: JobsService) {}

  @ApiOperation({
    summary: 'Check Switch',
    description: 'Allows a Foreman to check a switch',
  })
  @Post('scheduled/switch/check')
  async checkSwitch(
    @Body() switchData: { switchId: string; actualJobId: string },
  ): Promise<{
        switch: boolean;
        job: Job;
      }> {
    const response = await this.jobService.checkSwitch(switchData);
    return response;
  }

  @ApiOperation({ summary: 'Get scheduled jobs' })
  @ApiOkResponse({
    description: 'Scheduled Jobs',
    type: DriverScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'start', required: true, type: String })
  @ApiQuery({ name: 'end', required: true, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('scheduled')
  async getScheduledJobs(
    @CurrentUser() user: User,
      @Query() { skip, count, start, end }: DriverScheduledJobsQueryDTO,
  ): Promise<DriverScheduledJobDTO[]> {
    const scheduledJobs = await this.jobService.getDriverScheduledJobs(user, {
      start,
      end,
      skip,
      count,
    });

    return scheduledJobs.map(scheduledJob =>
      DriverScheduledJobDTO.fromModel(scheduledJob),
    );
  }

  @ApiOperation({ summary: 'Get active scheduled job' })
  @ApiOkResponse({
    description: 'Active scheduled Job',
    type: DriverScheduledJobDTO,
  })
  @Get('active')
  async getActiveScheduledJob(
    @CurrentUser() user: User,
  ): Promise<DriverScheduledJobDTO> {
    const scheduledJob = await this.jobService.getActiveScheduledJob(user);
    return scheduledJob && DriverScheduledJobDTO.fromModel(scheduledJob);
  }

  @ApiOperation({ summary: 'Get next scheduled job' })
  @ApiOkResponse({
    description: 'Next scheduled Job',
    type: DriverScheduledJobDTO,
  })
  @Get('next')
  async getNextScheduledJob(
    @CurrentUser() user: User,
  ): Promise<DriverScheduledJobDTO> {
    const scheduledJob = await this.jobService.getNextScheduledJob(user);

    return scheduledJob && DriverScheduledJobDTO.fromModel(scheduledJob);
  }

  @ApiOperation({ summary: 'Get week work scheduled job' })
  @ApiOkResponse({
    description: 'Driver week work',
    type: DriverActualWeekDTO,
  })
  @Get('week-work/:month')
  async getActualWeekWork(
    @CurrentUser() user: User,
      @Param('month') date: string,
  ): Promise<any[]> {
    const scheduledJobs = await this.jobService.getDriverWeekWork(user);
    const actualWeekSummary = await this.jobService.makeActualWeekList(
      user,
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
          driver,
          isPaid,
          ticketId,
          paidAt,
          orderNumber,
          accountNumber,
          paidWith,
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
        ) as any;
      });

      arr[index].weekWork = resultingSummary;
    });

    return actualWeekSummary;
  }

  @ApiOperation({ summary: 'Get job not finished' })
  @ApiOkResponse({
    description: 'Job not finished',
    type: DriverScheduledJobDTO,
  })
  @Get('not-finished')
  async getJobNotFinised(
    @CurrentUser() user: User,
  ): Promise<DriverScheduledJobDTO> {
    const scheduledJob = await this.jobService.getJobNotFinished(user);

    console.info('Scheduled job: ', scheduledJob);

    return (
      scheduledJob &&
      DriverScheduledJobDTO.fromModelWithAssignationDates(scheduledJob)
    );
  }

  @ApiOperation({ summary: 'Update driver insite or outsite' })
  @ApiOkResponse({
    description: 'Job not finished',
    type: DriverScheduledJobDTO,
  })
  @Patch('/assignation/:id')
  async updateDriverLocation(
    @CurrentUser() user: User,
      @Param('id') assignationId: string,
      @Body() { inside }: { inside: boolean },
  ): Promise<JobAssignation> {
    const scheduledJob = await this.jobService.updateDriverLocation(
      assignationId,
      inside,
    );

    return scheduledJob;
  }

  @ApiOperation({
    summary: 'Accept or Deny Switch request',
  })
  @ApiAcceptedResponse({
    description: 'Switch updated successfully',
    type: String,
  })
  @Patch('accept-deny-switch')
  async acceptOrDenyJobSwitch(
    @Body() switchBody: SwitchRequestDTO,
  ): Promise<{
        status: number;
        message: string;
      }> {
    return this.jobService.acceptOrDenyJobSwitch(switchBody);
  }
}
