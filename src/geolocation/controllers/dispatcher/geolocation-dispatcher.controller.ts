import { Controller, UseGuards, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { User, UserRole } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { GeolocationService } from '../../geolocation.service';
import { GeolocationDTO } from '../../dto/geolocation.dto';
import { Dispatcher } from '../../../user/dispatcher.model';
import { ContractorScheduledJobsQueryDTO } from '../../../jobs/dto/contractor-scheduled-jobs-query.dto';
import { IsVerifiedGuard } from '../../../common/is-verified.guard';
import { GeolocationJobDTO } from '../../dto/geolocation-job.dto';

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
@ApiTags('geolocation')
@Controller('dispatcher/geolocation')
export class GeolocationDispatcherController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @ApiOperation({ summary: 'Get locations scheduled jobs' })
  @ApiAcceptedResponse({
    description: 'Locations scheduled jobs',
    type: String,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @UseGuards(IsDispatcherVerified)
  @Get('jobs/scheduled')
  async getGeolocationJob(
    @CurrentUser() dispatcher: Dispatcher,
      @Query() { skip, count, active }: ContractorScheduledJobsQueryDTO,
  ): Promise<GeolocationJobDTO[]> {
    const geolocations = await this.geolocationService.getGeolocationScheduledJobsForContractor(
      await dispatcher.contractorCompany.contractor,
      { skip, count, active },
    );
    return geolocations;
  }

  @ApiOperation({ summary: 'Get locations job by jobId and truckId' })
  @ApiAcceptedResponse({
    description: 'Locations',
    type: GeolocationDTO,
  })
  @Get('job/:jobId/truck/:truckId')
  async getGeolocationJobIdTruckId(
    @CurrentUser() dispatcher: Dispatcher,
      @Param('jobId') jobId: string,
      @Param('truckId') truckId: string,
  ): Promise<GeolocationDTO[]> {
    const geolocations = await this.geolocationService.getGeolocationsForJobByTruckId(
      jobId,
      truckId,
    );
    return geolocations.map(geolocation =>
      GeolocationDTO.fromModel(geolocation),
    );
  }
}
