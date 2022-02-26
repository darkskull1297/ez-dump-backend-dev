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
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Get,
} from '@nestjs/common';
import { AdminCreateTruckDTO } from '../../dto/admin-create-truck.dto';
import { TruckDTO } from '../../dto/truck.dto';
import { IsNotSupportGuard } from '../../../auth/controllers/admin/is-not-support.guard';
import { UserRole } from '../../../user/user.model';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { TruckRepo } from '../../truck.repository';
import { TruckService } from '../../truck.service';
import { UpdateTruckDTO } from '../../dto/update-truck.dto';
import { TruckWithCompanyDTO } from '../../dto/truck-with-company.dto';

@ApiTags('truck')
@UseGuards(AuthGuard(), HasRole(UserRole.ADMIN))
@ApiBearerAuth('authorization')
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@Controller('admin/truck')
export class TruckAdminController {
  constructor(
    private readonly truckRepo: TruckRepo,
    private readonly truckService: TruckService,
  ) {}

  @ApiOperation({ summary: 'Add a truck' })
  @ApiAcceptedResponse({
    description: 'Created truck',
    type: TruckDTO,
  })
  @UseGuards(IsNotSupportGuard)
  @Post()
  async create(@Body() body: AdminCreateTruckDTO): Promise<TruckDTO> {
    const { company, ...truck } = body;
    const newTruck = await this.truckService.create(truck, company);
    return TruckDTO.fromModel(newTruck);
  }

  @ApiOperation({
    summary: 'Update Truck',
    description: "Allows an admin to update a truck's information",
  })
  @ApiAcceptedResponse({
    description: 'Updated truck',
    type: TruckDTO,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
      @Body() body: UpdateTruckDTO,
  ): Promise<TruckDTO> {
    const truck = await this.truckService.updateTruck(id, body);
    return TruckDTO.fromModel(truck);
  }

  @ApiOperation({
    summary: 'Disable Truck',
    description: 'Allows an Admin to disable a Truck',
  })
  @ApiAcceptedResponse({
    description: 'Disabled Truck',
    type: TruckDTO,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch(':id/disable')
  async DisableTruck(@Param('id') id: string): Promise<TruckDTO> {
    const foundTruck = await this.truckRepo.findById(id);
    foundTruck.isDisable = true;
    foundTruck.isActive = false;
    await this.truckRepo.save(foundTruck);
    return TruckDTO.fromModel(foundTruck);
  }

  @ApiOperation({
    summary: 'Remove truck',
    description: 'Allows an admin to remove a truck',
  })
  @ApiAcceptedResponse({
    description: 'Deleted',
    type: Boolean,
  })
  @UseGuards(IsNotSupportGuard)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.truckService.remove(id);
  }

  @ApiOperation({ summary: 'List all trucks' })
  @ApiAcceptedResponse({
    description: 'Trucks list',
    type: TruckWithCompanyDTO,
    isArray: true,
  })
  @Get()
  async list(): Promise<TruckWithCompanyDTO[]> {
    const trucks = await this.truckService.getAll();
    return trucks.map(truck => TruckWithCompanyDTO.fromModel(truck));
  }

  @ApiOperation({ summary: 'Get a truck' })
  @ApiAcceptedResponse({
    description: 'Truck',
    type: TruckDTO,
  })
  @Get(':id')
  async get(@Param('id') id: string): Promise<TruckDTO> {
    const truck = await this.truckService.get(id);
    return TruckDTO.fromModel(truck);
  }
}
