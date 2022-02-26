/* eslint-disable no-useless-catch */
import {
  Controller,
  UseGuards,
  Get,
  Query,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Put,
} from '@nestjs/common';
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
import { UserRole, User } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { JobsService } from '../../jobs.service';
import { ScheduleJobDTO } from '../../dto/schedule-job.dto';
import { ScheduledJobsQueryDTO } from '../../dto/scheduled-jobs-query.dto';
import { JobDTO } from '../../dto/job.dto';
import { ScheduledJobDTO } from '../../dto/scheduled-job.dto';
import { BasicScheduledJobDTO } from '../../dto/basic-scheduled-job.dto';
import { ScheduleJobResourcesDTO } from '../../dto/schedule-job-resources.dto';
import { PaginationDTO } from '../../../common/pagination.dto';
import { Owner } from '../../../user/owner.model';
import { IsVerifiedGuard } from '../../../common/is-verified.guard';
import { JobsTotalOwnerDTO } from '../../dto/jobs-total-owner.dto';
import { Job } from '../../job.model';
import { JobAssignation } from '../../job-assignation.model';
import { DriverActualWeekDTO } from '../../dto/driver-actual-week.dto';
import { Driver } from '../../../user/driver.model';
import { UserService } from '../../../user/user.service';
import { JobInvoiceService } from '../../../invoices/job-invoice.service';
import { UpdateJobDTO } from '../../dto/update-job.dto';
import { OwnerCompanyRepo } from '../../../company/owner-company.repository';

const IsOwnerVerified = IsVerifiedGuard(User, async (repo, user) => {
  return (user as Owner).verifiedByAdmin;
});

@ApiUnauthorizedResponse({
  description: 'Invalid token',
  type: FailureStringResponse,
})
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard(), HasRole(UserRole.OWNER))
@ApiTags('jobs')
@Controller('owner/jobs')
export class JobOwnerController {
  constructor(
    private readonly jobService: JobsService,
    private readonly jobInvoiceService: JobInvoiceService,
    private readonly userService: UserService,
    private readonly ownerCompanyRepo: OwnerCompanyRepo,
  ) {}

  @ApiOperation({ summary: 'Get incompleted jobs' })
  @ApiOkResponse({
    description: 'Incompleted Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @UseGuards(IsOwnerVerified)
  @Get('incomplete')
  async getIncompletedJobs(@CurrentUser() user: User): Promise<Job[]> {
    const jobs = await this.jobService.getOwnerIncompletedJobs(user);

    return jobs;
  }

  @ApiOperation({ summary: 'Remove Preferred Truck from assignations' })
  @ApiOkResponse({
    description: 'Remove Preferred Truck from assignations',
    type: Boolean,
  })
  @UseGuards(IsOwnerVerified)
  @Delete('/favorite-truck/:favoriteTruckId')
  async removeFavoriteTruckFromCategory(
    @Param('favoriteTruckId') favoriteTruckId: string,
  ): Promise<boolean> {
    const response = await this.jobService.removeFavoriteTruckFromCategory(
      favoriteTruckId,
    );

    return response;
  }

  @ApiOperation({ summary: 'Get all available jobs' })
  @ApiOkResponse({
    description: 'Available Jobs',
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @UseGuards(IsOwnerVerified)
  @Get()
  async getJobs(
    @CurrentUser() user: Owner,
      @Query('skip') skip = 0,
      @Query('count') count,
  ): Promise<JobDTO[]> {
    const jobs = await this.jobService.getJobs(user, skip, count);

    return Promise.all(jobs.map(job => JobDTO.fromModel(job)));
  }

  @ApiOperation({ summary: 'Schedule job' })
  @ApiAcceptedResponse({
    description: 'Schedule a new job',
    type: ScheduledJobDTO,
  })
  @UseGuards(IsOwnerVerified)
  @Post()
  async scheduleJob(
    @CurrentUser() user: User,
      @Body() schedule: ScheduleJobDTO,
  ): Promise<ScheduledJobDTO> {
    await this.jobService.scheduleJob(
      user,
      schedule.jobId,
      schedule.jobAssignations,
    );
    return new ScheduledJobDTO();
  }

  @ApiOperation({ summary: 'Get scheduled jobs' })
  @ApiOkResponse({
    description: 'Scheduled Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @UseGuards(IsOwnerVerified)
  @Get('scheduled')
  async getScheduledJobs(
    @CurrentUser() user: User,
      @Query() { skip, count }: ScheduledJobsQueryDTO,
  ): Promise<Job[]> {
    const jobs = await this.jobService.getOwnerScheduledJobs(user, {
      skip,
      count,
    });

    return jobs;
  }

  @ApiOperation({ summary: 'Get scheduled jobs' })
  @ApiOkResponse({
    description: 'Scheduled Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @UseGuards(IsOwnerVerified)
  @Get('active')
  async getActiveJobs(@CurrentUser() user: User): Promise<Job[]> {
    const jobs = await this.jobService.getOwnerActiveJobs(user);

    return jobs;
  }

  @ApiOperation({ summary: 'Get finished jobs' })
  @ApiOkResponse({
    description: 'Finished Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @UseGuards(IsOwnerVerified)
  @Get('done')
  async getJobsDone(
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const job = await this.jobService.getOwnerJobsDone(user, {
      skip,
      count,
    });

    return job;
  }

  @ApiOperation({ summary: 'Get jobs totals' })
  @ApiOkResponse({
    description: 'Jobs totals',
    type: JobsTotalOwnerDTO,
  })
  @Get('all-totals')
  async getJobsTotal(@CurrentUser() user: Owner): Promise<JobsTotalOwnerDTO> {
    const availableJobs = await this.jobService.getOwnerTotalAvailableJobs(
      user,
    );
    const totalScheduledJobs = await this.jobService.countOwnerScheduledJobs(
      user,
    );
    const totalActiveJobs = await this.jobService.countOwnerActiveJobs(user);
    const totalJobsDone = await this.jobService.countOwnerJobsDone(user);
    const totalIncompletedJobs = await this.jobService.countOwnerIncompletedJobs(
      user,
    );
    return {
      scheduledJobs: totalScheduledJobs,
      availableJobs,
      activeJobs: totalActiveJobs,
      doneJobs: totalJobsDone,
      incompleteJobs: totalIncompletedJobs,
    };
  }

  @ApiOperation({ summary: 'Get resources to schedule a job' })
  @ApiOkResponse({
    description: 'Resources',
    type: ScheduleJobResourcesDTO,
  })
  @Get('scheduled_job/resources/:id')
  @UseGuards(IsOwnerVerified)
  async getScheduleJobResourcesFromScheduledJob(
    @CurrentUser() user: User,
      @Param('id') jobId: string,
  ): Promise<ScheduleJobResourcesDTO> {
    const {
      trucks,
      drivers,
    } = await this.jobService.getResourcesFromScheduledJob(user, jobId);
    return ScheduleJobResourcesDTO.fromModel(drivers, trucks);
  }

  @ApiOperation({ summary: 'Get resources to schedule a job' })
  @ApiOkResponse({
    description: 'Resources',
    type: ScheduleJobResourcesDTO,
  })
  @Get('scheduled/resources/:id')
  @UseGuards(IsOwnerVerified)
  async getScheduleJobResources(
    @CurrentUser() user: User,
      @Param('id') jobId: string,
  ): Promise<ScheduleJobResourcesDTO> {
    const { trucks, drivers } = await this.jobService.getResources(user, jobId);
    return ScheduleJobResourcesDTO.fromModel(drivers, trucks);
  }

  @ApiOperation({ summary: 'Get scheduled job' })
  @ApiOkResponse({
    description: 'Scheduled Job',
    type: BasicScheduledJobDTO,
  })
  @UseGuards(IsOwnerVerified)
  @Get('active/:id')
  async getActiveJob(@Param('id') id: string): Promise<JobDTO> {
    // const job = await this.jobService.getJob(id);

    const job = await this.jobService.getJobWithAllCategories(id);

    const company = await this.jobService.getJobContractorCompany(job);

    return { ...JobDTO.fromModel(job), ...company, preferredTrucks: [] };
  }

  @ApiOperation({ summary: 'Get scheduled job' })
  @ApiOkResponse({
    description: 'Scheduled Job',
    type: BasicScheduledJobDTO,
  })
  @ApiQuery({ name: 'active', required: false, type: String })
  @ApiQuery({ name: 'done', required: false, type: String })
  @UseGuards(IsOwnerVerified)
  @Get('scheduled/:id')
  async getScheduledJob(
    @Param('id') id: string,
      @Query() { active, done }: { active: string; done: string },
  ): Promise<any> {
    const job = await this.jobService.getJob(
      id,
      active === 'true',
      false,
      done === 'true',
    );
    const company = await this.jobService.getJobContractorCompany(job);

    const invoice = await this.jobInvoiceService.getOwnerInvoicesByJobId(
      job.id,
    );
    const isPaid = invoice?.isPaid || null;

    return { ...job, contractorCompany: company, isPaid };
  }

  @ApiOperation({ summary: 'Get job' })
  @ApiOkResponse({
    description: 'Job',
    type: JobDTO,
  })
  @UseGuards(IsOwnerVerified)
  @Get(':id')
  async getJob(
    @Param('id') jobId: string,
      @CurrentUser() user: Owner,
  ): Promise<JobDTO> {
    const ownerCompany = await this.ownerCompanyRepo.findOwnerCompany(user.id);
    const job = await this.jobService.getJob(jobId, false, true);
    const company = await this.jobService.getJobContractorCompany(job);

    const filteredCategories = [];

    job.truckCategories.forEach(category => {
      if (
        !category.preferredTruck ||
        category.preferredTruck.company.id === ownerCompany.id
      ) {
        filteredCategories.push(category);
      }
    });

    job.truckCategories = filteredCategories;

    return JobDTO.fromModelWithContractorCompany(job, company);
  }

  @ApiOperation({
    summary: 'Cancel Job',
    description: 'Allows an owner to cancel a scheduled job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel scheduled job',
    type: Boolean,
  })
  @UseGuards(IsOwnerVerified)
  @Delete('scheduled/:id')
  async cancelScheduledJob(
    @CurrentUser() user: User,
      @Param('id') id: string,
  ): Promise<boolean> {
    const job = await this.jobService.getJob(id, false);

    try {
      await Promise.all(
        job.scheduledJobs.map(async scheduledJob => {
          await this.jobService.cancelOwnerScheduledJob(scheduledJob.id, user);
          return [];
        }),
      );
      return true;
    } catch (err) {
      throw err;
    }
  }

  @ApiOperation({ summary: 'Edit a job' })
  @ApiAcceptedResponse({
    description: 'Edit job',
    type: JobDTO,
  })
  @UseGuards(IsOwnerVerified)
  @Put('/:id')
  async editJob(
    @Body() job: UpdateJobDTO,
      @CurrentUser() user: User,
      @Param('id') jobId: string,
  ): Promise<JobDTO> {
    let truckCategories = [];

    if (job.truckCategories)
      truckCategories = job.truckCategories.reduce((categories, cat) => {
        return categories.concat(cat.toModel());
      }, []);

    const jobUpdated = await this.jobService.update(
      job.toModel(user),
      truckCategories,
      user,
      jobId,
      job.generalJobId,
      job.preferredTrucks,
    );

    return JobDTO.fromModel(jobUpdated);
  }

  @ApiOperation({
    summary: 'Edit Job Assignation',
    description: 'Allows an owner to edit job assignation',
  })
  @ApiAcceptedResponse({
    description: 'Edit Job Assignation',
    type: Boolean,
  })
  @UseGuards(IsOwnerVerified)
  @Patch('assignation/:assignationId/edit')
  editJobAssignation(
    @CurrentUser() user: User,
      @Param('assignationId') assignationId: string,
      @Body() data: { truckId: string; driverId: string },
  ): Promise<JobAssignation> {
    return this.jobService.editJobAssignationByOwner(
      assignationId,
      data.truckId,
      data.driverId,
    );
  }

  @ApiOperation({ summary: 'Get next scheduled job' })
  @ApiOkResponse({
    description: 'Next scheduled Job',
    type: DriverActualWeekDTO,
  })
  @Get('week-work/:id/:month')
  async getActualWeekWork(
    @Param('id') id: string,
      @Param('month') date: string,
  ): Promise<any[]> {
    const firstWeekday = moment(date)
      .startOf('month')
      .format('YYYY-MM-DD');
    const lastWeekday = moment(date)
      .endOf('month')
      .format('YYYY-MM-DD');

    const driver = await this.userService.getUser(id);

    const scheduledJobs = await this.jobService.getDriverWeekWorkById(
      id,
      firstWeekday,
      lastWeekday,
    );

    const actualWeekSummary = await this.jobService.makeActualWeekList(
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

  @ApiOperation({ summary: 'Set travel time to driver' })
  @ApiOkResponse({
    description: 'Success',
    type: Boolean,
  })
  @Post('week-work/:id')
  async changeDriverTravelTime(
    @Param('id') id: string,
      @Body('travelTime') travelTime: string,
  ): Promise<void> {
    this.jobService.changeDriverTravelTime(id, travelTime);
  }

  @ApiOperation({ summary: 'Get owner weekly report' })
  @ApiOkResponse({
    description: 'Weekly report',
  })
  @Get('report/:owner/:first/:last/:firstWeek/:lastWeek')
  async getWeeklyReport(
    @Param('owner') ownerId: string,
      @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Param('firstWeek') firstWeek: string,
      @Param('lastWeek') lastWeek: string,
  ): Promise<any> {
    return this.jobService.getOwnerWeeklyReport(
      ownerId,
      firstDay,
      lastDay,
      firstWeek,
      lastWeek,
    );
  }
}
