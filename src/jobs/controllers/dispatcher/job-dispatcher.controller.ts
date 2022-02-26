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

import { userInfo } from 'os';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole, User } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { JobsService } from '../../jobs.service';
import { UserService } from '../../../user/user.service';
import { UserRepo } from '../../../user/user.repository';
import { JobDTO } from '../../dto/job.dto';
import { BasicScheduledJobDTO } from '../../dto/basic-scheduled-job.dto';
import { ContractorScheduledJobsQueryDTO } from '../../dto/contractor-scheduled-jobs-query.dto';
import { PaginationDTO } from '../../../common/pagination.dto';
import { DisputeDTO } from '../../dto/dispute.dto';
import { Dispatcher } from '../../../user/dispatcher.model';
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

const IsDispatcherVerified = IsVerifiedGuard(User, async (repo, user) => {
  return (user as Dispatcher).verifiedEmail;
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
@UseGuards(AuthGuard(), HasRole(UserRole.DISPATCHER))
@ApiTags('jobs')
@Controller('dispatcher/jobs')
export class JobDispatcherController {
  constructor(
    private readonly jobService: JobsService,
    private readonly userService: UserService,
    private readonly userRepository: UserRepo,
  ) {}

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
    return this.jobService.getJobsWithNoEvidenceForUser(user);
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
  @UseGuards(IsDispatcherVerified)
  @Post()
  async createJob(
    @Body() job: JobDTO,
      @CurrentUser() user: Dispatcher,
  ): Promise<JobDTO> {
    const truckCategories = job.truckCategories.reduce((categories, cat) => {
      return categories.concat(cat.toModel());
    }, []);

    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );

    const newJob = await this.jobService.create(
      job.toModel(contractor),
      truckCategories,
      contractor,
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
  @UseGuards(IsDispatcherVerified)
  @Put('/:id')
  async editJob(
    @Body() job: UpdateJobDTO,
      @CurrentUser() user: Dispatcher,
      @Param('id') jobId: string,
  ): Promise<JobDTO> {
    let truckCategories = [];

    if (job.truckCategories)
      truckCategories = job.truckCategories.reduce((categories, cat) => {
        return categories.concat(cat.toModel());
      }, []);

    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );

    const jobUpdated = await this.jobService.update(
      job.toModel(contractor),
      truckCategories,
      contractor,
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
  @UseGuards(IsDispatcherVerified)
  @Put('/scheduled/:id')
  async editScheduledJob(
    @Body() job: UpdateJobDTO,
      @CurrentUser() user: Dispatcher,
      @Param('id') jobId: string,
  ): Promise<JobDTO> {
    let truckCategories = [];

    if (job.truckCategories)
      truckCategories = job.truckCategories.reduce((categories, cat) => {
        return categories.concat(cat.toModel());
      }, []);

    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );

    const jobUpdated = await this.jobService.updateScheduledJob(
      job.toModel(contractor),
      truckCategories,
      contractor,
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
  @UseGuards(IsDispatcherVerified)
  @Put('/active/:id')
  async editActiveJob(
    @Body() job: UpdateJobDTO,
      @CurrentUser() user: Dispatcher,
      @Param('id') jobId: string,
  ): Promise<JobDTO> {
    let truckCategories = [];

    if (job.truckCategories)
      truckCategories = job.truckCategories.reduce((categories, cat) => {
        return categories.concat(cat.toModel());
      }, []);

    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );

    const jobUpdated = await this.jobService.updateScheduledJob(
      job.toModel(contractor),
      truckCategories,
      contractor,
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
  @UseGuards(IsDispatcherVerified)
  @Get('scheduled')
  async getScheduledJobs(
    @CurrentUser() user: Dispatcher,
      @Query() { skip, count, active }: ContractorScheduledJobsQueryDTO,
  ): Promise<Job[]> {
    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    const jobs = await this.jobService.getContractorScheduledJobs(contractor, {
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
  @UseGuards(IsDispatcherVerified)
  @Get('/:generalJobId/requestedTrucks')
  async getRequestedTrucks(
    @CurrentUser() user: Dispatcher,
      @Param() generalJobId: string,
      @Query()
      { skip, count }: { skip: number; count: number },
  ): Promise<RequestTruck[]> {
    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    const requestedTrucks = await this.jobService.getRequestedTrucks(
      contractor,
      {
        skip,
        count,
        generalJobId,
      },
    );

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
    const contractor = await this.userService.getContractorByDispatcher(user);
    return this.jobService.getContractorTotalJobs(contractor);
  }

  @ApiOperation({ summary: 'Get jobs pending assignation' })
  @ApiOkResponse({
    description: "Jobs that haven't been assigned completely",
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @UseGuards(IsDispatcherVerified)
  @Get('pending')
  async getUnassignedJobs(
    @CurrentUser() user: Dispatcher,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    const jobs = await this.jobService.getContractorUnassignedJobs(contractor, {
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
  @UseGuards(IsDispatcherVerified)
  @Get('done')
  async getJobsDone(
    @CurrentUser() user: Dispatcher,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<BasicScheduledJobDTO[]> {
    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    const scheduledJobs = await this.jobService.getContractorJobsDone(
      contractor,
      {
        skip,
        count,
      },
    );
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
  @UseGuards(IsDispatcherVerified)
  @Get('incomplete')
  async getIncompleteJobs(
    @CurrentUser() user: Dispatcher,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    const jobs = await this.jobService.getContractorIncompleteJobs(contractor, {
      skip,
      count,
    });
    return jobs.map(job => JobDTO.fromModel(job));
  }

  @ApiOperation({ summary: 'Review scheduled job truck' })
  @ApiAcceptedResponse({ type: String })
  @UseGuards(IsDispatcherVerified)
  @Post('scheduled/:id/review-truck')
  async reviewScheduledJobTruck(
    @CurrentUser() user: Dispatcher,
      @Body() review: ReviewTruckDTO,
      @Param('id') scheduledJobId: string,
  ): Promise<string> {
    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    await this.jobService.reviewScheduledJobTruck(
      review,
      contractor,
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
  @UseGuards(IsDispatcherVerified)
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
  @UseGuards(IsDispatcherVerified)
  @Get('scheduled/:id')
  async getScheduledJob(
    @Param('id') id: string,
  ): Promise<BasicScheduledJobDTO> {
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
  @UseGuards(IsDispatcherVerified)
  @Get(':id')
  async getJob(@Param('id') jobId: string): Promise<JobDTO> {
    const job = await this.jobService.getJobWithAllCategories(jobId);
    const company = await this.jobService.getJobContractorCompany(job);
    return JobDTO.fromModelWithContractorCompany(job, company);
  }

  @ApiOperation({
    summary: 'Cancel Job',
    description: 'Allows a Dispatcher to cancel a scheduled job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel scheduled job',
    type: Boolean,
  })
  @UseGuards(IsDispatcherVerified)
  @Delete('scheduled/:id')
  cancelScheduledJob(@Param('id') id: string): Promise<boolean> {
    return this.jobService.cancelContractorScheduleJob(id);
  }

  @ApiOperation({
    summary: 'Cancel Job',
    description: 'Allows a Dispatcher to cancel a pending job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel pending job',
    type: Boolean,
  })
  @UseGuards(IsDispatcherVerified)
  @Delete('pending/:id')
  cancelPendingJob(@Param('id') id: string): Promise<boolean> {
    return this.jobService.cancelContractorPendingJob(id);
  }

  @ApiOperation({ summary: 'Dispute scheduled job' })
  @ApiAcceptedResponse({ type: String })
  @Post('dispute/:id')
  async reviewDispute(
    @CurrentUser() user: Dispatcher,
      @Body() { message }: DisputeDTO,
      @Param('id') scheduledJobId: string,
  ): Promise<string> {
    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    await this.jobService.disputeScheduledJob(
      scheduledJobId,
      contractor,
      message,
    );
    return 'Dispute created';
  }

  @ApiOperation({
    summary: 'Cancel Truck from Shift',
    description: 'Allows a Dispatcher to cancel a truck from shift job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel truck from shift',
    type: Boolean,
  })
  @UseGuards(IsDispatcherVerified)
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
  @UseGuards(IsDispatcherVerified)
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
  @UseGuards(IsDispatcherVerified)
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
    description: 'Allows a Dispatcher to finish an active shift',
  })
  @ApiAcceptedResponse({
    description: 'Finish an active Shift',
    type: Boolean,
  })
  @UseGuards(IsDispatcherVerified)
  @Delete('scheduled/finish/:jobId')
  async finishActiveJob(
    @Param('jobId') jobId: string,
      @CurrentUser() user: User,
  ): Promise<boolean> {
    const response = await this.jobService.finishActiveJob(jobId, user);
    return response;
  }

  @ApiOperation({ summary: 'Get Contractor Weekly Report' })
  @ApiOkResponse({
    description: 'Weekly report',
  })
  @Get('report/:dispatcher/:first/:last')
  async getWeeklyReport(
    @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Param('dispatcher') dispatcherId: string,
  ): Promise<any> {
    const dispatcher = await this.userRepository.findById(dispatcherId);
    const contractor = await this.userService.getContractorByDispatcher(
      dispatcher,
    );
    return this.jobService.getContractorWeeklyReport(
      contractor.id,
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
      @CurrentUser() user: Dispatcher,
  ): Promise<boolean> {
    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    return this.jobService.switchJobByMaterial(job, contractor);
  }
}
