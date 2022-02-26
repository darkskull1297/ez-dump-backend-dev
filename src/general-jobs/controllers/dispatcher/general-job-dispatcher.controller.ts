import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Query,
  Param,
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
import { JobsService } from '../../../jobs/jobs.service';
import { GeneralJobDto } from '../../dto/general-job.dto';
import { Dispatcher } from '../../../user/dispatcher.model';
import { IsVerifiedGuard } from '../../../common/is-verified.guard';
import { GeneralJobService } from '../../general-job.service';
import { JobDTO } from '../../../jobs/dto/job.dto';
import { BasicScheduledJobDTO } from '../../../jobs/dto/basic-scheduled-job.dto';
import { ContractorScheduledJobsQueryDTO } from '../../../jobs/dto/contractor-scheduled-jobs-query.dto';
import { PaginationDTO } from '../../../common/pagination.dto';
import { JobsTotalContractorDTO } from '../../../jobs/dto/jobs-total-contractor.dto';
import { Job } from '../../../jobs/job.model';
import { GeneralJobQueryDTO } from '../../general-job-query.dto';
import { ForemanRepo } from '../../../user/foreman.repository';
import { UserService } from '../../../user/user.service';

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
@ApiTags('general-job')
@Controller('dispatcher/general-job')
export class GeneralJobDispatcherController {
  constructor(
    private readonly jobService: JobsService,
    private readonly generalJobService: GeneralJobService,
    private readonly foremanRepo: ForemanRepo,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Get general jobs' })
  @ApiAcceptedResponse({
    description: 'Get general jobs',
    type: GeneralJobDto,
    isArray: true,
  })
  @UseGuards(IsDispatcherVerified)
  @Get()
  async getGeneralJobs(
    @CurrentUser() user: User,
      @Query() { skip, count, customerId }: GeneralJobQueryDTO,
  ): Promise<GeneralJobDto[]> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const generalJobs = await this.generalJobService.findGeneralJobs(
      contractor,
      {
        skip,
        count,
        customerId,
      },
    );
    return generalJobs?.map(generalJob => GeneralJobDto.fromModel(generalJob));
  }

  @ApiOperation({ summary: 'Create a new general job' })
  @ApiAcceptedResponse({
    description: 'Created general job',
    type: GeneralJobDto,
  })
  @UseGuards(IsDispatcherVerified)
  @Post()
  async createGeneralJob(
    @Body() generalJob: GeneralJobDto,
      @CurrentUser() user: User,
  ): Promise<GeneralJobDto> {
    const foremans = [];

    if (generalJob.foremans && generalJob.foremans.length > 0) {
      await Promise.all(
        generalJob.foremans.map(async foremanId => {
          const foreman = await this.foremanRepo.findById(foremanId);
          if (foreman) {
            foremans.push(foreman);
          }
        }),
      );
    }

    const contractor = await this.userService.getContractorByDispatcher(user);
    const newJob = await this.generalJobService.createGeneralJob(
      generalJob.toModel(),
      contractor,
      foremans,
    );
    return GeneralJobDto.fromModel(newJob);
  }

  @ApiOperation({ summary: 'Edit a new general job' })
  @ApiAcceptedResponse({
    description: 'Edit general job',
    type: GeneralJobDto,
  })
  @UseGuards(IsDispatcherVerified)
  @Patch('/:id')
  async editGeneralJob(
    @Body() generalJob: GeneralJobDto,
      @Param('id') jobId: string,
  ): Promise<GeneralJobDto> {
    const foremans = [];

    if (generalJob.foremans && generalJob.foremans.length > 0) {
      await Promise.all(
        generalJob.foremans.map(async foremanId => {
          const foreman = await this.foremanRepo.findById(foremanId);
          if (foreman) {
            foremans.push(foreman);
          }
        }),
      );
    }

    const generalJobEdited = await this.generalJobService.editGeneralJob(
      generalJob.toModel(),
      jobId,
      foremans,
    );
    return GeneralJobDto.fromModel(generalJobEdited);
  }

  @ApiOperation({ summary: 'Get general job' })
  @ApiAcceptedResponse({
    description: 'Get general job',
    type: GeneralJobDto,
  })
  @UseGuards(IsDispatcherVerified)
  @Get('/:generalJobId')
  async getGeneralJob(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
  ): Promise<GeneralJobDto> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const generalJob = await this.generalJobService.findGeneralJob(
      generalJobId,
      contractor,
    );
    return GeneralJobDto.fromModel(generalJob);
  }

  @ApiOperation({ summary: 'Get jobs totals' })
  @ApiOkResponse({
    description: 'Jobs totals',
    type: JobsTotalContractorDTO,
  })
  @Get('/:generalJobId/all-totals')
  async getJobsTotal(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
  ): Promise<JobsTotalContractorDTO> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    return this.generalJobService.getContractorTotalJobs(
      contractor,
      generalJobId,
    );
  }

  @ApiOperation({ summary: 'Get scheduled Jobs' })
  @ApiOkResponse({
    description: 'Scheduled Jobs',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @UseGuards(IsDispatcherVerified)
  @Get('/:generalJobId/scheduled')
  async getScheduleJobs(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
      @Query() { skip, count, active }: ContractorScheduledJobsQueryDTO,
  ): Promise<JobDTO[]> {
    const jobs = await this.generalJobService.getForemanScheduledJobs(
      user,
      {
        skip,
        count,
        active,
      },
      generalJobId,
    );
    return jobs.map(aux => JobDTO.fromModelWithScheduledJobs(aux));
  }

  @ApiOperation({ summary: 'Get active trucks' })
  @ApiOkResponse({
    description: 'Active trucks for general job',
    type: Number,
  })
  @Get('/:generalJobId/active-trucks')
  async getActiveTrucks(
    @Param('generalJobId') generalJobId: string,
  ): Promise<number> {
    return this.jobService.countTrucksActive(generalJobId);
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
  @Get('/:generalJobId/pending')
  async getUnassignedJobs(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const jobs = await this.generalJobService.getContractorUnassignedJobs(
      contractor,
      {
        skip,
        count,
      },
      generalJobId,
    );

    const returnData = jobs.map(aux => JobDTO.fromModelWithScheduledJobs(aux));

    return returnData;
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
  @Get('/:generalJobId/done')
  async getJobsDone(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const scheduledJobs = await this.generalJobService.getContractorJobsDone(
      contractor,
      {
        skip,
        count,
      },
      generalJobId,
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
  @UseGuards(IsDispatcherVerified)
  @Get('/:generalJobId/incomplete')
  async getIncompleteJobs(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const jobs = await this.generalJobService.getContractorIncompleteJobs(
      contractor,
      {
        skip,
        count,
      },
      generalJobId,
    );
    return jobs;
  }
}
