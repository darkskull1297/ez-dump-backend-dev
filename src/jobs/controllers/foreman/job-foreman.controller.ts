import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Query,
  Param,
  Delete,
  Put,
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

import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole, User } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { JobsService } from '../../jobs.service';
import { JobDTO } from '../../dto/job.dto';
import { RequestTruckDTO } from '../../dto/request-truck.dto';
import { BasicScheduledJobDTO } from '../../dto/basic-scheduled-job.dto';
import { ContractorScheduledJobsQueryDTO } from '../../dto/contractor-scheduled-jobs-query.dto';
import { PaginationDTO } from '../../../common/pagination.dto';
import { Foreman } from '../../../user/foreman.model';
import { JobsTotalContractorDTO } from '../../dto/jobs-total-contractor.dto';
import { UserService } from '../../../user/user.service';
import { TruckDTO } from '../../../trucks/dto/truck.dto';
import { ReviewTruckDTO } from '../../../reviews/dto/reviewTruck.dto';
import { ScheduledJob } from '../../scheduled-job.model';
import { Job } from '../../job.model';
import { SwitchJobDTO } from '../../dto/switch-job-dto';
import { SwitchRequestDTO } from '../../dto/switch-request-dto';
import { RequestTruck } from '../../request-truck.model';
import { Materials } from '../../materials.model';
import { UpdateJobDTO } from '../../dto/update-job.dto';

@ApiUnauthorizedResponse({
  description: 'Invalid token',
  type: FailureStringResponse,
})
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard(), HasRole(UserRole.FOREMAN))
@ApiTags('jobs')
@Controller('foreman/jobs')
export class JobForemanController {
  constructor(
    private readonly jobService: JobsService,
    private readonly userService: UserService,
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

  @ApiOperation({ summary: 'Get Requested Trucks' })
  @ApiOkResponse({
    description: 'Get Requested Trucks',
  })
  @Get('/:generalJobId/requestedTrucks')
  async getRequestedTrucks(
    @CurrentUser() user: Foreman,
      @Param() generalJobId: string,
      @Query()
      { skip, count }: { skip: number; count: number },
  ): Promise<RequestTruck[]> {
    const requestedTrucks = await this.jobService.getRequestedTrucksForeman(
      user,
      {
        skip,
        count,
        generalJobId,
      },
    );

    return requestedTrucks;
  }

  @ApiOperation({ summary: 'Get Requested Trucks' })
  @ApiOkResponse({
    description: 'Get Requested Trucks',
  })
  @Delete('/requestedTruck/:id')
  async deleteRequestedTruck(
    @CurrentUser() user: Foreman,
      @Param() id: string,
  ): Promise<boolean> {
    const response = await this.jobService.deleteRequestedTruck(id);

    return response;
  }

  @ApiOperation({
    summary: 'Check Switch',
    description: 'Allows a Foreman to check a switch',
  })
  @ApiAcceptedResponse({
    description: 'Allows a Foreman to check a switch',
    type: Boolean,
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

  @ApiOperation({ summary: 'Get jobs totals' })
  @ApiOkResponse({
    description: 'Jobs totals',
    type: JobsTotalContractorDTO,
  })
  @Get('all-totals')
  async getJobsTotal(
    @CurrentUser() user: User,
  ): Promise<JobsTotalContractorDTO> {
    return this.jobService.getForemanTotalJobs(user);
  }

  @ApiOperation({ summary: 'Create a new job' })
  @ApiAcceptedResponse({
    description: 'Created job',
    type: JobDTO,
  })
  @Post()
  async createJob(
    @Body() job: JobDTO,
      @CurrentUser() user: User,
  ): Promise<JobDTO> {
    const truckCategories = job.truckCategories.reduce((categories, cat) => {
      return categories.concat(cat.toModel());
    }, []);
    const contractor = (await (user as Foreman).contractorCompany
      .contractor) as User;
    const newJob = await this.jobService.create(
      job.toModel(user),
      truckCategories,
      contractor,
      job.generalJobId,
      null,
      job.preferredTrucks,
    );
    return JobDTO.fromModel(newJob);
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
  @Get('scheduled')
  async getScheduledJobs(
    @CurrentUser() user: User,
      @Query() { skip, count, active }: ContractorScheduledJobsQueryDTO,
  ): Promise<Job[]> {
    const contractor = (await (user as Foreman).contractorCompany
      .contractor) as User;
    const jobs = await this.jobService.getContractorScheduledJobs(contractor, {
      skip,
      count,
      active,
    });
    return jobs;
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
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const contractor = (await (user as Foreman).contractorCompany
      .contractor) as User;
    const jobs = await this.jobService.getContractorUnassignedJobs(contractor, {
      skip,
      count,
    });
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
  @Get('done')
  async getJobsDone(
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<ScheduledJob[]> {
    const contractor = (await (user as Foreman).contractorCompany
      .contractor) as User;
    const scheduledJobs = await this.jobService.getContractorJobsDone(
      contractor,
      {
        skip,
        count,
      },
    );
    return scheduledJobs;
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
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const contractor = (await (user as Foreman).contractorCompany
      .contractor) as User;
    const jobs = await this.jobService.getContractorIncompleteJobs(contractor, {
      skip,
      count,
    });
    return jobs;
  }

  @ApiOperation({ summary: 'Get scheduled job' })
  @ApiOkResponse({
    description: 'Scheduled Job',
    type: BasicScheduledJobDTO,
  })
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

  @ApiOperation({ summary: 'Edit a job' })
  @ApiAcceptedResponse({
    description: 'Edit job',
    type: JobDTO,
  })
  @UseGuards()
  @Put('/active/:id')
  async editActiveJob(
    @Body() job: UpdateJobDTO,
      @CurrentUser() user: Foreman,
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
      user,
      jobId,
      job.preferredTrucks,
      true,
    );

    return JobDTO.fromModel(jobUpdated);
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
  @Get(':id')
  async getJob(@Param('id') jobId: string): Promise<JobDTO> {
    const job = await this.jobService.getJobWithAllCategories(jobId);
    const company = await this.jobService.getJobContractorCompany(job);
    return JobDTO.fromModelWithContractorCompany(job, company);
  }

  @ApiOperation({
    summary: 'Cancel Job',
    description: 'Allows a foreman to cancel a scheduled job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel scheduled job',
    type: Boolean,
  })
  @Delete('scheduled/:id')
  cancelScheduledJob(@Param('id') id: string): Promise<boolean> {
    return this.jobService.cancelContractorScheduleJob(id);
  }

  @ApiOperation({
    summary: 'Cancel Job',
    description: 'Allows a foreman to cancel a pending job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel pending job',
    type: Boolean,
  })
  @Delete('pending/:id')
  cancelPendingJob(@Param('id') id: string): Promise<boolean> {
    return this.jobService.cancelContractorPendingJob(id);
  }

  @ApiOperation({
    summary: 'Send request truck',
    description: 'foreman can send request truck to contractors or dispatcher',
  })
  @ApiAcceptedResponse({
    description: 'Request truck',
    type: RequestTruckDTO,
  })
  @Post('/request-truck')
  sendRequestTruck(
    @Body() job: RequestTruckDTO,
      @CurrentUser() user: User,
  ): any {
    return this.jobService.sendForemanRequestTruck(job, user);
  }

  @ApiOperation({ summary: 'Edit a job' })
  @ApiAcceptedResponse({
    description: 'Edit job',
    type: JobDTO,
  })
  @Put('/:id')
  async editJob(
    @Body() job: JobDTO,
      @CurrentUser() user: Foreman,
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
  @Put('/scheduled/:id')
  async editScheduledJob(
    @Body() job: UpdateJobDTO,
      @CurrentUser() user: Foreman,
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
      user,
      jobId,
      job.preferredTrucks,
    );

    return JobDTO.fromModel(jobUpdated);
  }

  @ApiOperation({ summary: 'Get scheduled job trucks' })
  @ApiOkResponse({
    description: 'Truck',
    type: TruckDTO,
    isArray: true,
  })
  @Get('scheduled/:id/trucks')
  async getScheduledJobTruck(
    @Param('id') scheduledJobId: string,
  ): Promise<TruckDTO[]> {
    const trucks = await this.jobService.getScheduledJobTrucks(scheduledJobId);
    return trucks.map(truck =>
      TruckDTO.fromModelWithReview(truck.truck, truck.reviewed),
    );
  }

  @ApiOperation({ summary: 'Review scheduled job truck' })
  @ApiAcceptedResponse({ type: String })
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

  @ApiOperation({
    summary: 'Cancel Truck from Shift',
    description: 'Allows a contractor to cancel a truck from shift job',
  })
  @ApiAcceptedResponse({
    description: 'Cancel truck from shift',
    type: Boolean,
  })
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

  @ApiOperation({
    summary: 'Finish an active Shift',
    description: 'Allows a contractor to finish an active shift',
  })
  @ApiAcceptedResponse({
    description: 'Finish an active Shift',
    type: Boolean,
  })
  @Delete('scheduled/finish/:scheduleJobId')
  async finishActiveJob(
    @Param('scheduleJobId') scheduleJobId: string,
      @CurrentUser() user: User,
  ): Promise<boolean> {
    const response = await this.jobService.finishActiveJob(scheduleJobId, user);
    return response;
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

  @ApiOperation({ summary: 'Put job on hold or continue' })
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
      @CurrentUser() user: Foreman,
  ): Promise<boolean> {
    const contractor = await this.userService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    return this.jobService.switchJobByMaterial(job, contractor);
  }
}
