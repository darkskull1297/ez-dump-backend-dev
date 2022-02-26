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
import { UserRole } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { GeolocationService } from '../../geolocation.service';
import { GeolocationDTO } from '../../dto/geolocation.dto';
import { Owner } from '../../../user/owner.model';
import { ContractorScheduledJobsQueryDTO } from '../../../jobs/dto/contractor-scheduled-jobs-query.dto';
import { GeolocationJobDTO } from '../../dto/geolocation-job.dto';

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
@ApiTags('geolocation')
@Controller('owner/geolocation')
export class GeolocationOwnerController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @ApiOperation({ summary: 'Get locations scheduled jobs active' })
  @ApiAcceptedResponse({
    description: 'Locations scheduled jobs',
    type: String,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @Get('jobs/scheduled')
  async getGeolocationJob(
    @CurrentUser() owner: Owner,
      @Query() { skip, count, active }: ContractorScheduledJobsQueryDTO,
  ): Promise<GeolocationJobDTO[]> {
    const geolocations = await this.geolocationService.geoGeolocationScheduledJobsForOwner(
      owner,
      { skip, count, active },
    );
    return geolocations;
  }

  @ApiOperation({ summary: 'Get locations job by jobId and driverId' })
  @ApiAcceptedResponse({
    description: 'Locations',
    type: GeolocationDTO,
  })
  @Get('job/:jobId/driver/:driverId')
  async getGeolocationJobIdDriverId(
    @CurrentUser() owner: Owner,
      @Param('jobId') jobId: string,
      @Param('driverId') driverId: string,
  ): Promise<GeolocationDTO[]> {
    const geolocations = await this.geolocationService.getGeolocationsForJobByDriverId(
      jobId,
      driverId,
    );
    return geolocations.map(geolocation =>
      GeolocationDTO.fromModel(geolocation),
    );
  }

  @ApiOperation({ summary: 'Get locations job by jobId and truckId' })
  @ApiAcceptedResponse({
    description: 'Locations',
    type: GeolocationDTO,
  })
  @Get('job/:scheduleJobId/truck/:truckId')
  async getGeolocationJobIdTruckId(
    @CurrentUser() owner: Owner,
      @Param('scheduleJobId') scheduleJobId: string,
      @Param('truckId') truckId: string,
  ): Promise<GeolocationDTO[]> {
    const geolocations = await this.geolocationService.getGeolocationsForOwnerJobByTruckId(
      scheduleJobId,
      truckId,
    );
    return geolocations.map(geolocation =>
      GeolocationDTO.fromModel(geolocation),
    );
  }
}
