import { Controller, UseGuards, Get, Query, Param } from '@nestjs/common';
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
import { GeolocationService } from '../../geolocation.service';
import { ContractorScheduledJobsQueryDTO } from '../../../jobs/dto/contractor-scheduled-jobs-query.dto';
import { GeolocationJobDTO } from '../../dto/geolocation-job.dto';
import { GeolocationDTO } from '../../dto/geolocation.dto';

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
@ApiTags('geolocation')
@Controller('admin/geolocation')
export class GeolocationAdminController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @ApiOperation({ summary: 'Get locations scheduled jobs' })
  @ApiAcceptedResponse({
    description: 'Locations scheduled jobs',
    type: String,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @Get('jobs/scheduled')
  async getGeolocationJob(
    @Query() { skip, count }: ContractorScheduledJobsQueryDTO,
  ): Promise<GeolocationJobDTO[]> {
    return this.geolocationService.getAdminGeolocationScheduledJobs({
      skip,
      count,
    });
  }

  @ApiOperation({ summary: 'Get locations job by jobId and truckId' })
  @ApiAcceptedResponse({
    description: 'Locations',
    type: GeolocationDTO,
  })
  @Get('job/:jobId/truck/:truckId')
  async getGeolocationJobIdTruckId(
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
