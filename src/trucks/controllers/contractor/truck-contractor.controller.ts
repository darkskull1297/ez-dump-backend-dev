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
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';

import { UserRole } from '../../../user/user.model';
import { TruckDTO } from '../../dto/truck.dto';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { TruckService } from '../../truck.service';
import { CurrentUser } from '../../../user/current-user.decorator';
import { Contractor } from '../../../user/contractor.model';

@ApiTags('truck')
@UseGuards(AuthGuard(), HasRole(UserRole.CONTRACTOR))
@ApiBearerAuth('authorization')
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@Controller('contractor/truck')
export class TruckContractorController {
  constructor(private readonly truckService: TruckService) {}

  @ApiOperation({ summary: 'Get Trucks' })
  @ApiAcceptedResponse({
    description: 'Get Trucks',
    type: TruckDTO,
  })
  @Get()
  async getAllTrucks(@CurrentUser() user: Contractor): Promise<TruckDTO[]> {
    const trucks = await this.truckService.getAllTrucks(user.id);

    return trucks.map(truck => TruckDTO.fromModel(truck));
  }

  @ApiOperation({ summary: 'Get Favorite Trucks' })
  @ApiAcceptedResponse({
    description: 'Got Favorite Trucks',
    type: TruckDTO,
  })
  @Get('favorite/')
  async getFavoriteTrucks(
    @Query('isForJob') isForJob,
      @CurrentUser() user: Contractor,
  ): Promise<TruckDTO[]> {
    let trucks = [];

    if (isForJob === 'true') {
      trucks = await this.truckService.getFavoriteTrucksForJob(user.id);
    } else {
      trucks = await this.truckService.getFavoriteTrucks(user.id);
    }

    return trucks.map(truck => TruckDTO.fromModel(truck));
  }

  @ApiOperation({ summary: 'Add Favorite Truck' })
  @ApiAcceptedResponse({
    description: 'Add Favorite Truck',
    type: TruckDTO,
  })
  @Delete('favorite/truck/:truckId')
  async removeFavoriteTruck(
    @CurrentUser() user: Contractor,
      @Param('truckId') truckId: string,
  ): Promise<TruckDTO[]> {
    const trucks = await this.truckService.removeFavoriteTruck(
      truckId,
      user.id,
    );

    return trucks.map(truck => TruckDTO.fromModel(truck));
  }

  @ApiOperation({ summary: 'Add Favorite Truck' })
  @ApiAcceptedResponse({
    description: 'Add Favorite Truck',
    type: TruckDTO,
  })
  @Post('favorite/truck')
  async addFavoriteTruck(
    @CurrentUser() user: Contractor,
      @Body() { truckId }: { truckId: string },
  ): Promise<TruckDTO[]> {
    const trucks = await this.truckService.addFavoriteTruck(truckId, user.id);

    return trucks.map(truck => TruckDTO.fromModel(truck));
  }
}
