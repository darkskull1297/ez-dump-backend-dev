import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiAcceptedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  UseGuards,
  Get,
  Body,
  Post,
  Param,
  Put,
  Query,
} from '@nestjs/common';

import { User, UserRole } from '../../../user/user.model';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { CurrentUser } from '../../../user/current-user.decorator';
import { TruckService } from '../../truck.service';
import { TruckDTO } from '../../dto/truck.dto';
import { TruckInspection } from '../../truck-inspection.model';
import { TruckPunchDTO } from '../../dto/truck-punch.dto';
import { Driver } from '../../../user/driver.model';
import { TruckPunch } from '../../truck-punch.model';
import { Inspection } from '../../inspection-type';

@ApiTags('truck')
@UseGuards(AuthGuard(), HasRole(UserRole.DRIVER))
@ApiBearerAuth('authorization')
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@Controller('driver/truck')
export class TruckDriverController {
  constructor(private readonly truckService: TruckService) {}

  @ApiOperation({ summary: 'Punch In Out' })
  @Get('last/punch')
  async getLastPunch(@CurrentUser() user: Driver): Promise<TruckPunch> {
    return this.truckService.getLastPunch(user);
  }

  @ApiOperation({ summary: 'Punch In Out' })
  @Post('punch/in')
  async punchIn(
    @CurrentUser() user: Driver,
      @Body() data: TruckPunchDTO,
  ): Promise<TruckPunch> {
    return this.truckService.generateTruckPunch(user, data);
  }

  @ApiOperation({ summary: 'Punch In Out' })
  @Put('punch/out/:truckPunchId')
  async punchOut(
    @CurrentUser() user: Driver,
      @Param('truckPunchId') truckPunchId: string,
      @Body() data: TruckPunchDTO,
  ): Promise<TruckPunch> {
    return this.truckService.generateTruckPunch(user, data, truckPunchId);
  }

  @ApiOperation({ summary: 'Validate Inspections' })
  @Get('verify/inspections/:jobId/:truckId')
  async verifyTruckInspectionsForJob(
    @Param('jobId') jobId: string,
      @Param('truckId') truckId: string,
  ): Promise<{
        preTripInspection: TruckInspection;
        postTripInspection: TruckInspection;
      }> {
    const data = await this.truckService.verifyTruckInspectionForTruck(
      jobId,
      truckId,
    );
    return data;
  }

  @ApiOperation({ summary: "List user's owner trucks" })
  @ApiAcceptedResponse({
    description: 'Trucks list',
    type: TruckDTO,
    isArray: true,
  })
  @Get()
  async list(
    @CurrentUser() user: User,
      @Query() { start, end }: { start: string; end: string },
  ): Promise<any> {
    const trucks = await this.truckService.getTrucksByOwnerForDriver(user, {
      start,
      end,
    });
    return trucks;
  }

  @ApiOperation({ summary: 'Save Truck Inspection' })
  @ApiAcceptedResponse({
    description: 'Success',
    type: Boolean,
  })
  @Post(':truckId')
  async createInspection(
    @Body('inspection') inspection: Inspection,
      @Param('truckId') truckId: string,
      @CurrentUser() user: User,
  ): Promise<string> {
    return this.truckService.createTruckInspection(inspection, user, truckId);
  }

  @ApiOperation({ summary: 'Save Truck Inspection' })
  @ApiAcceptedResponse({
    description: 'Success',
    type: Boolean,
  })
  @Get('image/:title')
  async getImageURL(@Param('title') title: string): Promise<string> {
    return this.truckService.getUploadImageURL(title);
  }
}
