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
import { Dispatcher } from '../../../user/dispatcher.model';
import { UserService } from '../../../user/user.service';

@ApiTags('truck')
@UseGuards(AuthGuard(), HasRole(UserRole.DISPATCHER))
@ApiBearerAuth('authorization')
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@Controller('dispatcher/truck')
export class TruckDispatcherController {
  constructor(
    private readonly truckService: TruckService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Get Trucks' })
  @ApiAcceptedResponse({
    description: 'Get Trucks',
    type: TruckDTO,
  })
  @Get()
  async getAllTrucks(@CurrentUser() user: Dispatcher): Promise<TruckDTO[]> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const trucks = await this.truckService.getAllTrucks(contractor.id);

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
      @CurrentUser() user: Dispatcher,
  ): Promise<TruckDTO[]> {
    let trucks = [];
    const contractor = await this.userService.getContractorByDispatcher(user);

    if (isForJob === 'true') {
      trucks = await this.truckService.getFavoriteTrucksForJob(contractor.id);
    } else {
      trucks = await this.truckService.getFavoriteTrucks(contractor.id);
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
    @CurrentUser() user: Dispatcher,
      @Param('truckId') truckId: string,
  ): Promise<TruckDTO[]> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const trucks = await this.truckService.removeFavoriteTruck(
      truckId,
      contractor.id,
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
    @CurrentUser() user: Dispatcher,
      @Body() { truckId }: { truckId: string },
  ): Promise<TruckDTO[]> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const trucks = await this.truckService.addFavoriteTruck(
      truckId,
      contractor.id,
    );

    return trucks.map(truck => TruckDTO.fromModel(truck));
  }
}
