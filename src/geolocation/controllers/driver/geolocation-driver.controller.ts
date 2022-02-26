import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { User, UserRole } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { GeolocationService } from '../../geolocation.service';
import { GeolocationDTO } from '../../dto/geolocation.dto';
import { Loads } from '../../loads.model';
import { Geofence } from '../../geofence-type';
import { Driver } from '../../../user/driver.model';

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
@ApiTags('geolocation')
@Controller('driver/geolocation')
export class GeolocationDriverController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @ApiOperation({ summary: 'Create a location record' })
  @ApiAcceptedResponse({
    description: 'Message',
    type: String,
  })
  @Post('geofence')
  async loadCoordsFromGeofencing(
    @Body() body: Geofence,
      @CurrentUser() user: User,
  ): Promise<number> {
    const loadNumber = await this.geolocationService.createFromGeofence(
      body,
      user,
    );
    return loadNumber;
  }

  @ApiOperation({ summary: 'Send current location' })
  @ApiAcceptedResponse({
    description: 'Message',
    type: String,
  })
  @Post()
  async createGeolocation(
    @Body() geolocation: GeolocationDTO,
      @CurrentUser() user: User,
  ): Promise<number> {
    const load = await this.geolocationService.create(
      geolocation.toModel(),
      user,
    );
    return load;
  }

  @ApiOperation({ summary: 'Get current total travels' })
  @ApiAcceptedResponse({
    description: 'Total travels',
    type: Number,
  })
  @Get('total-travels')
  async getTotalTravels(@CurrentUser() driver: User): Promise<number> {
    return this.geolocationService.getTotalTravels(driver);
  }

  @ApiOperation({ summary: 'Get current total travels by Job id' })
  @ApiAcceptedResponse({
    description: 'Total travels',
    type: Number,
  })
  @Get('total-travels/:jobId')
  async getTotalTravelsByJobId(
    @CurrentUser() driver: User,
      @Param('jobId') jobId?: string,
  ): Promise<number> {
    return this.geolocationService.getTotalTravels(driver, jobId);
  }

  @ApiOperation({ summary: 'Save locations' })
  @ApiAcceptedResponse({
    description: 'Message',
    type: Number,
  })
  @Post('locations/total-travels')
  async getTotalTravelsByLocations(
    @Body() locations: GeolocationDTO[],
      @CurrentUser() user: User,
  ): Promise<number> {
    return this.geolocationService.getTotalTravelsByLocations(locations, user);
  }

  @ApiOperation({ summary: 'Update locations' })
  @ApiAcceptedResponse({
    description: 'Confirmation',
    type: Boolean,
  })
  @Post('locations')
  async locations(): Promise<boolean> {
    return true;
  }

  @ApiOperation({ summary: 'Update on motion change event' })
  @ApiAcceptedResponse({
    description: 'Confirmation',
    type: Boolean,
  })
  @Patch('motion-change')
  async onMotionChange(
    @Body() event: any,
      @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.geolocationService.onMotionChange(event, user);
  }

  @ApiOperation({ summary: 'Update sync' })
  @ApiAcceptedResponse({
    description: 'Confirmation',
    type: Boolean,
  })
  @Post('sync')
  async sync(): Promise<boolean> {
    return true;
  }

  @ApiOperation({ summary: 'Get load entries' })
  @ApiAcceptedResponse({
    description: 'Loads',
    type: Loads,
  })
  @Get('loads/:job/:truck')
  async getLoads(
    @CurrentUser() driver: Driver,
      @Param('job') jobID: string,
      @Param('truck') truckID: string,
  ): Promise<Loads[]> {
    return this.geolocationService.getLoadsForDriver(jobID, truckID, driver);
  }

  @ApiOperation({ summary: 'Check if loads are completed' })
  @ApiAcceptedResponse({
    description: 'Accepted!',
    type: Boolean,
  })
  @Get('loads/check/:job/:truck')
  async checkCompletedLoads(
    @Param('job') jobID: string,
      @Param('truck') truckID: string,
  ): Promise<boolean> {
    return this.geolocationService.checkCompletedLoads(jobID, truckID);
  }

  @ApiOperation({ summary: 'Update loads' })
  @ApiAcceptedResponse({
    description: 'Updated!',
    type: Boolean,
  })
  @Patch(`loads`)
  async updateLoads(@Body('loads') loads: Loads[]): Promise<boolean> {
    return this.geolocationService.updateLoads(loads);
  }

  @ApiOperation({ summary: 'Count manual load' })
  @ApiAcceptedResponse({
    description: 'Updated!',
    type: Boolean,
  })
  @Patch('count/load')
  async countLoad(@CurrentUser() driver: Driver): Promise<number> {
    return this.geolocationService.countLoad(driver);
  }
}
