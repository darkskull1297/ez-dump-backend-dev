import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Put,
  Query,
  Param,
  Delete,
  Patch,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole, User } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { JobsService } from '../../jobs.service';
import { JobDTO } from '../../dto/job.dto';
import { BasicScheduledJobDTO } from '../../dto/basic-scheduled-job.dto';
import { ContractorScheduledJobsQueryDTO } from '../../dto/contractor-scheduled-jobs-query.dto';
import { PaginationDTO } from '../../../common/pagination.dto';
import { DisputeDTO } from '../../dto/dispute.dto';
import { Contractor } from '../../../user/contractor.model';
import { IsVerifiedGuard } from '../../../common/is-verified.guard';
import { JobsTotalContractorDTO } from '../../dto/jobs-total-contractor.dto';
import { ReviewTruckDTO } from '../../../reviews/dto/reviewTruck.dto';
import { TruckDTO } from '../../../trucks/dto/truck.dto';
import { SwitchJobDTO } from '../../dto/switch-job-dto';
import { RequestTruck } from '../../request-truck.model';
import { Materials } from '../../materials.model';
import { UpdateJobDTO } from '../../dto/update-job.dto';
import { ScheduledJob } from '../../scheduled-job.model';
import { Job } from '../../job.model';
import { DeleteOrClockOutJobAssignationsDTO } from '../../dto/delete-or-clock-out-job-assignation.dto';

const IsContractorVerified = IsVerifiedGuard(User, async (repo, user) => {
  return (user as Contractor).verifiedByAdmin;
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
@UseGuards(AuthGuard(), HasRole(UserRole.CONTRACTOR))
@ApiTags('jobs')
@Controller('contractor/jobs')
export class JobContractorController {
  constructor(private readonly jobService: JobsService) {}

  @ApiOperation({
    summary: 'Get jobs without evidence that have finished',
  })
  @ApiAcceptedResponse({
    description: 'Jobs without evidence',
    type: ScheduledJob,
  })
  @Get('not-finished')
  async getJobsWithoutEvidence(
    @CurrentUser() user: User,
  ): Promise<ScheduledJob[]> {
    return this.jobService.getJobsWithNoEvidence(user);
  }

  @ApiOperation({
    summary: 'Duplicate job order',
  })
  @ApiAcceptedResponse({
    description: 'Job Duplicated',
    type: Boolean,
  })
  @Post('duplicate')
  async duplicateJobOrder(@Body('jobId') jobId: string): Promise<void> {
    await this.jobService.duplicateJobOrder(jobId);
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

  @ApiOperation({ summary: 'Create a new job' })
  @ApiAcceptedResponse({
    description: 'Created job',
    type: JobDTO,
  })
  @UseGuards(IsContractorVerified)
  @Post()
  async createJob(
    @Body() job: JobDTO,
      @CurrentUser() user: User,
  ): Promise<JobDTO> {
    const truckCategories = job.truckCategories.reduce((categories, cat) => {
      return categories.concat(cat.toModel());
    }, []);

    const newJob = await this.jobService.create(
      job.toModel(user),
      truckCategories,
      user,
      job.generalJobId,
      job.requestedTruckId,
      job.preferredTrucks,
    );
    return JobDTO.fromModel(newJob);
  }

  @ApiOperation({ summary: 'Extend the shift finish time' })
  @ApiOkResponse({ description: 'Finish time extended successfully' })
  @Patch(':jobID/extend-time')
  async extendShiftTime(
    @Param('jobID') jobID: string,
      @Body() { data }: { data: Date },
  ): Promise<string> {
    return this.jobService.extendFinishTime(jobID, data);
  }

  @ApiOperation({ summary: 'Edit a job' })
  @ApiAcceptedResponse({
    description: 'Edit job',
    type: JobDTO,
  })
  @UseGuards(IsContractorVerified)
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

  @ApiOperation({ summary: 'Edit a job' })
  @ApiAcceptedResponse({
    description: 'Edit job',
    type: JobDTO,
  })
  @UseGuards(IsContractorVerified)
  @Put('/scheduled/:id')
  async editScheduledJob(
    @Body() job: UpdateJobDTO,
      @CurrentUser() user: User,
      @Param('id') jobId: string,
  ): Promise<JobDTO> {
    let truckCategories = [];

    if (job.truckCategories)
      truckCategories = job.truckCategories.reduce((categories, cat) => {
        return categories.concat(cat.toModel());
      }, []);

    const jobUpdated = await this.jobService.updateScheduledJob(
      job.toModel(user),
      truckCategories,
      user,
      jobId,
      job.preferredTrucks,
    );

    return JobDTO.fromModel(jobUpdated);
  }

  @ApiOperation({ summary: 'Edit a job' })
  @ApiAcceptedResponse({
    description: 'Edit job',
    type: JobDTO,
  })
  @UseGuards(IsContractorVerified)
  @Put('/active/:id')
  async editActiveJob(
    @Body() job: UpdateJobDTO,
      @CurrentUser() user: User,
      @Param('id') jobId: string,
  ): Promise<JobDTO> {
    let truckCategories = [];

    if (job.truckCategories)
      truckCategories = job.truckCategories.reduce((categories, cat) => {
        return categories.concat(cat.toModel());
      }, []);

    const jobUpdated = await this.jobService.updateScheduledJob(
      job.toModel(user),
      truckCategories,
      user,
      jobId,
      job.preferredTrucks,
      true,
    );

    return JobDTO.fromModel(jobUpdated);
  }

  @ApiOperation({ summary: 'Get scheduled jobs' })
  @ApiOkResponse({
    description: 'Scheduled Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @UseGuards(IsContractorVerified)
  @Get('scheduled')
  async getScheduledJobs(
    @CurrentUser() user: User,
      @Query() { skip, count, active }: ContractorScheduledJobsQueryDTO,
  ): Promise<Job[]> {
    const jobs = await this.jobService.getContractorScheduledJobs(user, {
      skip,
      count,
      active,
    });

    return jobs;
  }

  @ApiOperation({ summary: 'Get Requested Trucks' })
  @ApiOkResponse({
    description: 'Get Requested Trucks',
  })
  @UseGuards(IsContractorVerified)
  @Get('/:generalJobId/requestedTrucks')
  async getRequestedTrucks(
    @CurrentUser() user: User,
      @Param() generalJobId: string,
      @Query()
      { skip, count }: { skip: number; count: number },
  ): Promise<RequestTruck[]> {
    const requestedTrucks = await this.jobService.getRequestedTrucks(user, {
      skip,
      count,
      generalJobId,
    });

    return requestedTrucks;
  }

  @ApiOperation({ summary: 'Get jobs totals' })
  @ApiOkResponse({
    description: 'Jobs totals',
    type: JobsTotalContractorDTO,
  })
  @Get('all-totals')
  async getJobsTotal(
    @CurrentUser() user: User,
  ): Promise<JobsTotalContractorDTO> {
    return this.jobService.getContractorTotalJobs(user);
  }

  @ApiOperation({ summary: 'Get jobs pending assignation' })
  @ApiOkResponse({
    description: "Jobs that haven't been assigned completely",
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @UseGuards(IsContractorVerified)
  @Get('pending')
  async getUnassignedJobs(
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const jobs = await this.jobService.getContractorUnassignedJobs(user, {
      skip,
      count,
    });
    return jobs.map(job => JobDTO.fromModel(job));
  }

  @ApiOperation({ summary: 'Get finished jobs' })
  @ApiOkResponse({
    description: 'Finished Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @UseGuards(IsContractorVerified)
  @Get('done')
  async getJobsDone(
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<BasicScheduledJobDTO[]> {
    const scheduledJobs = await this.jobService.getContractorJobsDone(user, {
      skip,
      count,
    });
    return scheduledJobs.map(scheduledJob =>
      BasicScheduledJobDTO.fromModel(scheduledJob),
    );
  }

  @ApiOperation({ summary: 'Get incomplete jobs' })
  @ApiOkResponse({
    description: "Jobs that haven't been assigned and it's past its date",
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @UseGuards(IsContractorVerified)
  @Get('incomplete')
  async getIncompleteJobs(
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const jobs = await this.jobService.getContractorIncompleteJobs(user, {
      skip,
      count,
    });
    return jobs.map(job => JobDTO.fromModel(job));
  }

  @ApiOperation({ summary: 'Review scheduled job truck' })
  @ApiAcceptedResponse({ type: String })
  @UseGuards(IsContractorVerified)
  @Post('scheduled/:id/review-truck')
  async reviewScheduledJobTruck(
    @CurrentUser() user: User,
      @Body() review: ReviewTruckDTO,
      @Param('id') scheduledJobId: string,
  ): Promise<string> {
    await this.jobService.reviewScheduledJobTruck(
      review,
      user,
      scheduledJobId,
      review.truckId,
    );
    return 'Review created';
  }

  @ApiOperation({ summary: 'Get scheduled job trucks' })
  @ApiOkResponse({
    description: 'Truck',
    type: TruckDTO,
    isArray: true,
  })
  @UseGuards(IsContractorVerified)
  @Get('scheduled/:id/trucks')
  async getScheduledJobTruck(
    @Param('id') scheduledJobId: string,
  ): Promise<TruckDTO[]> {
    const trucks = await this.jobService.getScheduledJobTrucks(scheduledJobId);
    return trucks.map(truck =>
      TruckDTO.fromModelWithReview(truck.truck, truck.reviewed),
    );
  }

  @ApiOperation({ summary: 'Get scheduled job' })
  @ApiOkResponse({
    description: 'Scheduled Job',
    type: BasicScheduledJobDTO,
  })
  @UseGuards(IsContractorVerified)
  @Get('scheduled/:id')
  async getScheduledJob(
    @Param('id') id: string,
  ): Promise<BasicScheduledJobDTO> {
    // const job = await this.jobService.getJob(id);

    const scheduledJob = await this.jobService.getScheduledJob(id);

    const company = await this.jobService.getJobContractorCompany(
      scheduledJob.job,
    );

    return BasicScheduledJobDTO.fromModelWithCompany(scheduledJob, company);
  }

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

  @ApiOperation({ summary: 'Get job' })
  @ApiOkResponse({
    description: 'Job',
    type: JobDTO,
  })
  @UseGuards(IsContractorVerified)
  @Get(':id')
  async getJob(@Param('id') jobId: string): Promise<JobDTO> {
    const job = await this.jobService.getJobWithAllCategories(jobId);
    const company = await this.jobService.getJobContractorCompany(job);
    return JobDTO.fromModelWithContractorCompany(job, company);
  }

  @ApiOperation({
    summary: 'Cancel Job',
    description: 'Allows a contractor to cancel a scheduled job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel scheduled job',
    type: Boolean,
  })
  @UseGuards(IsContractorVerified)
  @Delete('scheduled/:id')
  cancelScheduledJob(@Param('id') id: string): Promise<boolean> {
    return this.jobService.cancelContractorScheduleJob(id);
  }

  @ApiOperation({
    summary: 'Cancel Job',
    description: 'Allows a contractor to cancel a pending job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel pending job',
    type: Boolean,
  })
  @UseGuards(IsContractorVerified)
  @Delete('pending/:id')
  cancelPendingJob(@Param('id') id: string): Promise<boolean> {
    return this.jobService.cancelContractorPendingJob(id);
  }

  @ApiOperation({ summary: 'Dispute scheduled job' })
  @ApiAcceptedResponse({ type: String })
  @Post('dispute/:id')
  async reviewDispute(
    @CurrentUser() user: User,
      @Body() { message }: DisputeDTO,
      @Param('id') scheduledJobId: string,
  ): Promise<string> {
    await this.jobService.disputeScheduledJob(scheduledJobId, user, message);
    return 'Dispute created';
  }

  @ApiOperation({
    summary: 'Cancel Truck from Shift',
    description: 'Allows a contractor to cancel a truck from shift job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel truck from shift',
    type: Boolean,
  })
  @UseGuards(IsContractorVerified)
  @Delete('scheduled/:jobId/remove-truck/:truckId')
  async cancelTruckScheduledJob(
    @Param('jobId') jobId: string,
      @Param('truckId') truckId: string,
      @CurrentUser() user: User,
  ): Promise<boolean> {
    const response = await this.jobService.cancelTruckScheduleJob(
      jobId,
      truckId,
      user,
    );
    return response;
  }

  @ApiOperation({ summary: 'Remove Job Assignations' })
  @ApiAcceptedResponse({
    description: 'Remove Job Assignations',
    type: Boolean,
  })
  @UseGuards(IsContractorVerified)
  @Post(':id/assignations/delete')
  async removeJobAssignations(
    @Body() data: DeleteOrClockOutJobAssignationsDTO,
      @CurrentUser() user: User,
      @Param('id') jobId: string,
  ): Promise<any> {
    await this.jobService.removeJobAssignationsByOwner(jobId, data);
    return true;
  }

  @ApiOperation({ summary: 'Clock Out Job Assignations' })
  @ApiAcceptedResponse({
    description: 'Clock Out Job Assignations',
    type: Boolean,
  })
  @UseGuards(IsContractorVerified)
  @Post('/active/:id/assignations/clock-out')
  async clockoutJobAssignations(
    @Body() data: DeleteOrClockOutJobAssignationsDTO,
      @CurrentUser() user: User,
      @Param('id') jobId: string,
  ): Promise<any> {
    await this.jobService.clockoutJobAssignationsByOwner(jobId, data, user);
    return true;
  }

  @ApiOperation({
    summary: 'Finish an active Shift',
    description: 'Allows a contractor to finish an active shift',
  })
  @ApiAcceptedResponse({
    description: 'Finish an active Shift',
    type: Boolean,
  })
  @UseGuards(IsContractorVerified)
  @Delete('scheduled/finish/:jobId')
  async finishActiveJob(
    @Param('jobId') jobId: string,
      @CurrentUser() user: User,
  ): Promise<boolean> {
    const response = await this.jobService.finishActiveJob(jobId, user);
    return response;
  }

  @ApiOperation({ summary: 'Get owner weekly report' })
  @ApiOkResponse({
    description: 'Weekly report',
  })
  @Get('report/:contractor/:first/:last')
  async getWeeklyReport(
    @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Param('contractor') contractorId: string,
  ): Promise<any> {
    return this.jobService.getContractorWeeklyReport(
      contractorId,
      firstDay,
      lastDay,
    );
  }

  @ApiOperation({ summary: 'Put job on hold or continue it' })
  @ApiOkResponse({
    description: 'Success',
  })
  @Put('hold/:jobId')
  async holdOrContinueJob(
    @Param('jobId') jobId: string,
      @Body() { hold, type }: { hold: boolean; type: string },
  ): Promise<boolean> {
    return this.jobService.holdOrContinueJob(jobId, hold, type);
  }

  @ApiOperation({ summary: 'Switch job for material change' })
  @ApiOkResponse({
    description: 'Success',
  })
  @Post('change-material')
  async changeMaterial(
    @Body() job: any,
      @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.jobService.switchJobByMaterial(job, user);
  }
}
