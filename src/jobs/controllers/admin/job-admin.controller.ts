import {
  Controller,
  UseGuards,
  Get,
  Query,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiOkResponse,
  ApiQuery,
  ApiAcceptedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { User, UserRole } from '../../../user/user.model';
import { JobsService } from '../../jobs.service';
import { JobDTO } from '../../dto/job.dto';
import { PaginationDTO } from '../../../common/pagination.dto';
import { BasicScheduledJobDTO } from '../../dto/basic-scheduled-job.dto';
import { CompleteScheduledJobDTO } from '../../dto/complete-scheduled-job.dto';
import { ReviewDisputeDTO } from '../../dto/review-dispute.dto';
import { ScheduledJobEarningsDTO } from '../../dto/scheduled-job-earnings.dto';
import { CurrentUser } from '../../../user/current-user.decorator';
import { SwitchJobDTO } from '../../dto/switch-job-dto';
import { ContractorScheduledJobsQueryDTO } from '../../dto/contractor-scheduled-jobs-query.dto';
import { ScheduledJob } from '../../scheduled-job.model';
import { GeneralJobService } from '../../../general-jobs/general-job.service';
import { Materials } from '../../materials.model';
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
@UseGuards(AuthGuard(), HasRole(UserRole.ADMIN))
@ApiTags('jobs')
@Controller('admin/jobs')
export class JobAdminController {
  constructor(
    private readonly jobService: JobsService,
    private readonly generalJobService: GeneralJobService,
  ) {}

  @ApiOperation({ summary: 'Get materials ' })
  @ApiOkResponse({
    description: 'Materials',
    type: Array,
  })
  @Get('materials/:generalJobId')
  async getMaterials(
    @Param('generalJobId') generalJobId: string,
  ): Promise<Materials[]> {
    return this.jobService.getMaterials(generalJobId);
  }

  @ApiOperation({ summary: 'Remove Preferred Truck from assignations' })
  @ApiOkResponse({
    description: 'Remove Preferred Truck from assignations',
    type: Boolean,
  })
  @Delete('/favorite-truck/:favoriteTruckId')
  async removeFavoriteTruckFromCategory(
    @Param('favoriteTruckId') favoriteTruckId: string,
  ): Promise<boolean> {
    const response = await this.jobService.removeFavoriteTruckFromCategory(
      favoriteTruckId,
    );

    return response;
  }

  @ApiOperation({ summary: 'Get active Jobs' })
  @ApiOkResponse({
    description: 'Scheduled Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @Get('/active')
  async getActiveJobs(
    @CurrentUser() user: User,
      @Query() { skip, count }: ContractorScheduledJobsQueryDTO,
  ): Promise<Job[]> {
    const scheduledJobs = await this.generalJobService.getAdminScheduledJobs(
      user,
      {
        skip,
        count,
        active: true,
      },
    );
    return scheduledJobs;
  }

  @ApiOperation({
    summary: 'Request Driver Shift Switch',
  })
  @ApiAcceptedResponse({
    description: 'Switch request sent',
    type: String,
  })
  @Post('switch-job-request')
  async requestJobSwitch(@Body() switchBody: SwitchJobDTO): Promise<boolean> {
    return this.jobService.requestJobSwitch(switchBody);
  }

  @ApiOperation({
    summary: 'Request Driver Shift Switch',
  })
  @ApiAcceptedResponse({
    description: 'Switch request sent',
    type: String,
  })
  @Post('favoriteTruck')
  async assignPreferredTruck(
    @Body() data: { jobId: string; truckId: string },
  ): Promise<boolean> {
    return this.jobService.assignPreferredTruckByAdmin(data);
  }

  @ApiOperation({ summary: 'Edit a job' })
  @ApiAcceptedResponse({
    description: 'Edit job',
    type: JobDTO,
  })
  @Put('/:id')
  async editJob(
    @Body() job: JobDTO,
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
    );

    return JobDTO.fromModel(jobUpdated);
  }

  @ApiOperation({ summary: 'Get jobs pending assignation' })
  @ApiOkResponse({
    description: "Jobs that haven't been assigned completely",
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get()
  async getAvailableJobs(
    @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const jobs = await this.jobService.getAdminAvailableJobs({
      skip,
      count,
    });
    return jobs.map(job => JobDTO.fromModel(job));
  }

  @ApiOperation({ summary: 'Get scheduled jobs' })
  @ApiOkResponse({
    description: 'Scheduled Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('scheduled')
  async getScheduledJobs(
    @Query() { skip, count }: PaginationDTO,
  ): Promise<BasicScheduledJobDTO[]> {
    const scheduledJobs = await this.jobService.getAdminScheduledJobs({
      skip,
      count,
    });
    return scheduledJobs.map(scheduledJob =>
      BasicScheduledJobDTO.fromModel(scheduledJob),
    );
  }

  @ApiOperation({ summary: 'Get jobs done' })
  @ApiOkResponse({
    description: 'Scheduled Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('done')
  async getJobsDone(
    @Query() { skip, count }: PaginationDTO,
  ): Promise<BasicScheduledJobDTO[]> {
    const scheduledJobs = await this.jobService.getAdminJobsDone({
      skip,
      count,
    });

    const scheduledJobsWithEarnings = [];
    await Promise.all(
      scheduledJobs.map(async scheduledJob => {
        const earnings = await this.jobService.calculateEarnings(scheduledJob);
        // const obj = { scheduledJob, earnings };
        return scheduledJobsWithEarnings.push({ scheduledJob, earnings });
        // return scheduledJobsWithEarnings;
      }),
    );
    return scheduledJobsWithEarnings.map(scheduledJob =>
      BasicScheduledJobDTO.fromModelWithEarnings(
        scheduledJob.scheduledJob,
        scheduledJob.earnings,
      ),
    );
  }

  @ApiOperation({ summary: 'Get jobs pending assignation' })
  @ApiOkResponse({
    description: "Jobs that haven't been assigned completely",
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('pending')
  async getUnassignedJobs(
    @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const jobs = await this.jobService.getAdminPendingJobs({
      skip,
      count,
    });
    return jobs.map(job => JobDTO.fromModel(job));
  }

  @ApiOperation({ summary: 'Get incomplete jobs' })
  @ApiOkResponse({
    description: "Jobs that haven't been assigned and it's past its date",
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('incomplete')
  async getIncompleteJobs(
    @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const jobs = await this.jobService.getAdminIncompleteJobs({ skip, count });
    return jobs.map(job => JobDTO.fromModel(job));
  }

  @ApiOperation({ summary: 'Get canceled jobs by contractors' })
  @ApiOkResponse({
    description: 'Get canceled jobs by contractors',
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('canceled')
  async getAllCanceledJobsByContractors(
    @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const jobs = await this.jobService.getAdminCanceledJobsByContractors({
      skip,
      count,
    });
    return jobs.map(job => JobDTO.fromModel(job));
  }

  @ApiOperation({ summary: 'Get canceled jobs by owners' })
  @ApiOkResponse({
    description: 'Get canceled jobs by owners',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('scheduled/canceled')
  async getCanceledScheduledJob(
    @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const scheduledJobs = await this.jobService.getAdminCanceledScheduledJobs({
      skip,
      count,
    });
    return scheduledJobs;
  }

  @ApiOperation({ summary: 'Get scheduled job earnings' })
  @ApiOkResponse({
    description: 'Scheduled Job',
    type: ScheduledJobEarningsDTO,
  })
  @Get('scheduled/:id/earnings')
  async getScheduledJobEarnings(
    @Param('id') id: string,
  ): Promise<ScheduledJobEarningsDTO> {
    const scheduledJob = await this.jobService.getScheduledJob(id);
    const earnings = await this.jobService.calculateEarnings(scheduledJob);
    return { earnings, id: scheduledJob.id };
  }

  @ApiOperation({ summary: 'Get scheduled job' })
  @ApiOkResponse({
    description: 'Scheduled Job',
    type: BasicScheduledJobDTO,
  })
  @Get('scheduled/:id')
  async getScheduledJob(
    @Param('id') id: string,
  ): Promise<CompleteScheduledJobDTO> {
    const scheduledJob = await this.jobService.getScheduledJob(id);
    const company = await this.jobService.getJobContractorCompany(
      scheduledJob.job,
    );
    const timeEntries = [];
    await Promise.all(
      scheduledJob.assignations.map(async assignation => {
        const entries = await this.jobService.getTimeEntries(
          scheduledJob.job.id,
          assignation.driver,
        );
        if (entries.length > 0) {
          return timeEntries.push(...entries);
        }
        return timeEntries;
      }),
    );
    if (timeEntries.length > 0) {
      return CompleteScheduledJobDTO.fromModelWithCompanyAndTimeEntries(
        scheduledJob,
        company,
        timeEntries,
      );
    }
    return CompleteScheduledJobDTO.fromModelWithCompany(scheduledJob, company);
  }

  @ApiOperation({ summary: 'Get job' })
  @ApiOkResponse({
    description: 'Job',
    type: JobDTO,
  })
  @Get(':id')
  async getJob(@Param('id') jobId: string): Promise<JobDTO> {
    const job = await this.jobService.getJobWithAllCategories(jobId);
    const company = await this.jobService.getJobContractorCompany(job);
    return JobDTO.fromModelWithContractorCompany(job, company);
  }

  @ApiOperation({ summary: 'Review dispute' })
  @ApiAcceptedResponse({
    type: String,
  })
  @Post('dispute/:id')
  async reviewDispute(
    @Body() { confirm }: ReviewDisputeDTO,
      @Param('id') scheduledJobId: string,
  ): Promise<string> {
    await this.jobService.reviewDispute(scheduledJobId, confirm);
    return `Dispute ${confirm ? 'accepted' : 'rejected'}`;
  }

  @ApiOperation({ summary: 'Get admin weekly report' })
  @ApiOkResponse({
    description: 'Weekly report',
  })
  @Get('report/:first/:last/:firstWeek/:lastWeek')
  async getWeeklyReport(
    @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Param('firstWeek') firstWeek: string,
      @Param('lastWeek') lastWeek: string,
  ): Promise<any> {
    return this.jobService.getAdminWeeklyReport(
      firstDay,
      lastDay,
      firstWeek,
      lastWeek,
    );
  }
}
