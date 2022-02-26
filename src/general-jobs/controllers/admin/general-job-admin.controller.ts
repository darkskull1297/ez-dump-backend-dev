import { Controller, UseGuards, Get, Query, Param } from '@nestjs/common';
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
import { Admin } from '../../../user/admin.model';
import { IsVerifiedGuard } from '../../../common/is-verified.guard';
import { GeneralJobService } from '../../general-job.service';
import { JobDTO } from '../../../jobs/dto/job.dto';
import { BasicScheduledJobDTO } from '../../../jobs/dto/basic-scheduled-job.dto';
import { ContractorScheduledJobsQueryDTO } from '../../../jobs/dto/contractor-scheduled-jobs-query.dto';
import { PaginationDTO } from '../../../common/pagination.dto';
import { JobsTotalContractorDTO } from '../../../jobs/dto/jobs-total-contractor.dto';
import { ScheduledJob } from '../../../jobs/scheduled-job.model';
import { Job } from '../../../jobs/job.model';
import { JobsTotalAdminDTO } from '../../../jobs/dto/jobs-total-admin.dto';

const IsForemanVerified = IsVerifiedGuard(User, async (repo, user) => {
  return (user as Admin).verifiedEmail;
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
@UseGuards(AuthGuard(), HasRole(UserRole.ADMIN))
@ApiTags('general-job')
@Controller('admin/general-job')
export class GeneralJobAdminController {
  constructor(
    private readonly jobService: JobsService,
    private readonly generalJobService: GeneralJobService,
  ) {}

  @ApiOperation({ summary: 'Get all available jobs' })
  @ApiOkResponse({
    description: 'Available Jobs',
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('/:generalJobId/available')
  async getAdminAvailableJobs(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
      @Query('skip') skip = 0,
      @Query('count') count = 10,
  ): Promise<JobDTO[]> {
    const jobs = await this.jobService.getAdminJobs(generalJobId, skip, count);
    return Promise.all(jobs.map(job => JobDTO.fromModel(job)));
  }

  @ApiOperation({ summary: 'Get general jobs' })
  @ApiAcceptedResponse({
    description: 'Get general jobs',
    type: GeneralJobDto,
    isArray: true,
  })
  @UseGuards(IsForemanVerified)
  @Get()
  async getGeneralJobs(
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<GeneralJobDto[]> {
    const generalJobs = await this.generalJobService.getAdminGeneralJobs(user, {
      skip,
      count,
    });

    const response = await Promise.all(
      generalJobs.map(async general => {
        const availableShifts: number = await this.generalJobService.getAdminTotalAvailableJobs(
          user,
          general.id,
        );

        return {
          ...GeneralJobDto.fromModel(general),
          availableShifts,
        };
      }),
    );

    return response;
  }

  @ApiOperation({ summary: 'Get general job' })
  @ApiAcceptedResponse({
    description: 'Get general job',
    type: GeneralJobDto,
  })
  @UseGuards(IsForemanVerified)
  @Get('/:generalJobId')
  async getGeneralJob(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
  ): Promise<GeneralJobDto> {
    const generalJob = await this.generalJobService.findAdminGeneralJob(
      generalJobId,
      user,
    );
    return GeneralJobDto.fromModel(generalJob);
  }

  @ApiOperation({ summary: 'Get jobs totals' })
  @ApiOkResponse({
    description: 'Jobs totals',
    type: JobsTotalAdminDTO,
  })
  @Get('/:generalJobId/all-totals')
  async getJobsTotal(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
  ): Promise<JobsTotalAdminDTO> {
    return this.generalJobService.getAdminTotalJobs(user, generalJobId);
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
  @UseGuards(IsForemanVerified)
  @Get('/:generalJobId/scheduled')
  async getScheduleJobs(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
      @Query() { skip, count, active }: ContractorScheduledJobsQueryDTO,
  ): Promise<JobDTO[]> {
    const jobs = await this.generalJobService.getAdminScheduledJobs(
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

  @ApiOperation({ summary: 'Get jobs pending assignation' })
  @ApiOkResponse({
    description: "Jobs that haven't been assigned completely",
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @UseGuards(IsForemanVerified)
  @Get('/:generalJobId/pending')
  async getUnassignedJobs(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<JobDTO[]> {
    const jobs = await this.generalJobService.getAdminUnassignedJobs(
      user,
      {
        skip,
        count,
      },
      generalJobId,
    );
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
  @UseGuards(IsForemanVerified)
  @Get('/:generalJobId/done')
  async getJobsDone(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const scheduledJobs = await this.generalJobService.getAdminJobsDone(
      user,
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
  @UseGuards(IsForemanVerified)
  @Get('/:generalJobId/incomplete')
  async getIncompleteJobs(
    @CurrentUser() user: User,
      @Param('generalJobId') generalJobId: string,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const jobs = await this.generalJobService.getAdminIncompleteJobs(
      user,
      {
        skip,
        count,
      },
      generalJobId,
    );
    return jobs;
  }

  @ApiOperation({ summary: 'Get canceled jobs by contractors' })
  @ApiOkResponse({
    description: 'Get canceled jobs by contractors',
    type: JobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('/:generalJobId/canceled')
  async getAllCanceledJobsByContractors(
    @Param('generalJobId') generalJobId: string,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const jobs = await this.jobService.getAdminCanceledJobsByContractors({
      skip,
      count,
      generalJobId,
    });
    return jobs;
  }

  @ApiOperation({ summary: 'Get canceled jobs by owners' })
  @ApiOkResponse({
    description: 'Get canceled jobs by owners',
    type: BasicScheduledJobDTO,
    isArray: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @Get('/:generalJobId/scheduled/canceled')
  async getCanceledScheduledJob(
    @Param('generalJobId') generalJobId: string,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<Job[]> {
    const scheduledJobs = await this.jobService.getAdminCanceledScheduledJobs({
      skip,
      count,
      generalJobId,
    });

    console.log('HERE HERE HERE', scheduledJobs);

    return scheduledJobs;
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
}
