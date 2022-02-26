import { Controller, UseGuards, Post, Param, Get, Body } from '@nestjs/common';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiOkResponse,
  ApiAcceptedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  FailureStringResponse,
  SuccessStringResponse,
} from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole, User } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { TimerService } from '../../timer.service';
import { TimeEntryDTO } from '../../dto/time-entry.dto';
import { Driver } from '../../../user/driver.model';
import { FinishJobDTO } from '../../dto/finish-job.dto';
import { LocationDTO } from '../../../jobs/dto/location.dto';

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
@ApiTags('timer')
@Controller('driver/timer')
export class TimerDriverController {
  constructor(private readonly timerService: TimerService) {}

  @ApiOperation({
    summary: 'Get finish job upload image url',
    description:
      'Returns the url to upload a signature image or evidence images',
  })
  @ApiAcceptedResponse({
    description: 'Url',
    type: SuccessStringResponse,
  })
  @Get('image')
  getUploadFinishJobImagesUrl(@CurrentUser() user: User): Promise<string> {
    return this.timerService.getUploadImageLink(user);
  }

  @ApiOperation({
    summary: 'Get job finished upload image url',
    description:
      'Returns the url to upload a signature image or evidence images for jobs not clocked out',
  })
  @ApiAcceptedResponse({
    description: 'Url',
    type: SuccessStringResponse,
  })
  @Get('image/:jobId')
  getUploadJobNotFinishedImagesUrl(
    @CurrentUser() user: User,
      @Param('jobId') jobId: string,
  ): Promise<string> {
    return this.timerService.getUploadImageLink(user, jobId);
  }

  @ApiOperation({ summary: 'Get time entries for job' })
  @ApiOkResponse({
    description: 'Time entries',
    type: TimeEntryDTO,
    isArray: true,
  })
  @Get(':id')
  async getTimeEntries(
    @CurrentUser() user: User,
      @Param('id') jobId: string,
  ): Promise<TimeEntryDTO[]> {
    const timeEntries = await this.timerService.getTimeEntries(user, jobId);
    return TimeEntryDTO.fromModels(timeEntries);
  }

  @ApiOperation({ summary: 'Clock in Job' })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @Post('clock-in/:id')
  async clockInJob(
    @CurrentUser() user: User,
      @Param('id') jobId: string,
      @Body() location: LocationDTO,
  ): Promise<string> {
    await this.timerService.clockIn(
      user as Driver,
      jobId,
      location.toModel(),
      location.switching,
    );

    return 'Job clocked in successfully';
  }

  @ApiOperation({ summary: 'Clock in Job' })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @Post('check-inside-area/:id')
  async checkUserInsideArea(
    @CurrentUser() user: User,
      @Param('id') jobId: string,
      @Body() location: LocationDTO,
  ): Promise<string> {
    await this.timerService.checkIsInsideArea(
      user as Driver,
      jobId,
      location.toModel(),
    );
    return 'User inside the area';
  }

  @ApiOperation({ summary: 'Break a Job' })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @Post('break')
  async breakJob(@CurrentUser() user: User): Promise<string> {
    await this.timerService.break(user);
    return 'Successful break';
  }

  @ApiOperation({ summary: 'Resume job' })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @Post('resume/:truckId')
  async resumeJob(
    @CurrentUser() user: User,
      @Param('truckId') truckId: string,
  ): Promise<string> {
    await this.timerService.resume(user, truckId);
    return 'Resumed successfully';
  }

  @Post('finish')
  async finishJob(
    @CurrentUser() user: Driver,
      @Body() body: FinishJobDTO,
  ): Promise<string> {
    const {
      signature,
      tons,
      load,
      evidenceImgs,
      totalTravels,
      comment,
      supervisorComment,
      supervisorName,
      timeSupervisor,
    } = body;
    await this.timerService.finishJob(
      user,
      signature,
      tons,
      load,
      evidenceImgs,
      totalTravels,
      comment,
      null,
      supervisorComment,
      supervisorName,
      timeSupervisor,
    );
    return 'Finished job successfully';
  }

  @ApiOperation({ summary: 'Finish job' })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @Post('finish/:jobId')
  async finishJobClockeOut(
    @CurrentUser() user: Driver,
      @Body() body: FinishJobDTO,
      @Param('jobId') jobId: string,
  ): Promise<string> {
    const {
      signature,
      tons,
      load,
      evidenceImgs,
      totalTravels,
      comment,
      supervisorComment,
      supervisorName,
    } = body;

    await this.timerService.addEvidenceToFinishedJob(
      user,
      signature,
      tons,
      load,
      evidenceImgs,
      totalTravels,
      comment,
      jobId,
      supervisorComment,
      supervisorName,
    );
    return 'Finished job successfully';
  }
}
