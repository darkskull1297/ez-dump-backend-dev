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
  Body,
  Post,
  Get,
  Query,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { DocumentNotFoundException } from '../../../common/exceptions/document-not-found.exception';
import { User, UserRole } from '../../../user/user.model';
import { TruckDTO } from '../../dto/truck.dto';
import { FailureStringResponse } from '../../../common/response.model';
import { Truck } from '../../truck.model';
import { HasRole } from '../../../auth/has-role.guard';
import { OwnsModelGuard } from '../../../common/owns-model.guard';
import { CurrentUser } from '../../../user/current-user.decorator';
import { TruckRepo } from '../../truck.repository';
import { TruckService } from '../../truck.service';
import { TaskOrderRepo } from '../../task-order.repository';
import { AssetsRepo } from '../../assets.repository';
import { WorkOrderRepo } from '../../work-order.repository';
import { WorkOrderItemsRepo } from '../../work-order-items.repository';
import { UpdateTruckDTO } from '../../dto/update-truck.dto';
import { Owner } from '../../../user/owner.model';
import { TruckWithCompanyDTO } from '../../dto/truck-with-company.dto';
import { TruckTotalsDTO } from '../../dto/truck-totals.dto';
import { TruckInspectionDTO } from '../../dto/truck-inspection.dto';
import { DefectsDTO } from '../../dto/defects.dto';
import { DefectDTO } from '../../dto/defect.dto';
import { MaintenanceDTO } from '../../dto/maintenance.dto';
import { ExpensesDTO } from '../../dto/expenses.dto';
import { TaskOrderDTO } from '../../dto/task-order.dto';
import { TaskOrderType } from '../../task-order-type';
import { WorkOrderDTO } from '../../dto/work-order.dto';
import { WorkOrderItemDTO } from '../../dto/work-order-item.dto';
import { WorkOrderType } from '../../work-order-type';
import { WorkOrderItemsType } from '../../work-order-items-type';
import { DriversBoardDTO } from '../../dto/drivers-board.dto';
import { DriverBoardDTO } from '../../dto/driver-board.dto';
import { TrucksBoardDTO } from '../../dto/trucks-board.dto';
import { TruckBoardDTO } from '../../dto/truck-board.dto';

const OwnsTruck = OwnsModelGuard(Truck, 'id', async (repo, id, user) => {
  const truck = await repo.findOne(id);
  if (!truck) {
    throw new DocumentNotFoundException('Truck', id);
  }
  const owner = await truck.company.owner;
  return owner.id === user.id;
});

@ApiTags('truck')
@UseGuards(AuthGuard(), HasRole(UserRole.OWNER))
@ApiBearerAuth('authorization')
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@Controller('owner/truck')
export class TruckOwnerController {
  constructor(
    private readonly truckRepo: TruckRepo,
    private readonly truckService: TruckService,
    private readonly taskOrderRepo: TaskOrderRepo,
    private readonly assetsRepo: AssetsRepo,
    private readonly workOrderRepo: WorkOrderRepo,
    private readonly workOrderItemsRepo: WorkOrderItemsRepo,
  ) {}

  @ApiOperation({ summary: 'Add a Truck' })
  @ApiAcceptedResponse({
    description: 'Created Truck',
    type: TruckDTO,
  })
  @Post()
  async create(
    @Body() body: TruckDTO,
      @CurrentUser() user: Owner,
  ): Promise<TruckDTO> {
    const truck = await this.truckService.create(body, user.id);

    return TruckDTO.fromModel(truck);
  }

  @ApiOperation({ summary: "Get User's Trucks List" })
  @ApiAcceptedResponse({
    description: "Got User's Trucks List",
    type: TruckWithCompanyDTO,
    isArray: true,
  })
  @Get()
  async list(@CurrentUser() user: User): Promise<TruckWithCompanyDTO[]> {
    const trucks = await this.truckService.getOwnerTrucks(user);
    return trucks.map(truck => TruckWithCompanyDTO.fromModel(truck));
  }

  @ApiOperation({
    summary: 'Update a Truck',
    description: "Allows an Owner to update truck's information",
  })
  @ApiAcceptedResponse({
    description: 'Updated Truck',
    type: TruckDTO,
  })
  @UseGuards(OwnsTruck)
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
    description: 'Allows an Owner to disable one of its trucks',
  })
  @ApiAcceptedResponse({
    description: 'Disabled Truck',
    type: TruckDTO,
  })
  @UseGuards(OwnsTruck)
  @Patch(':id/disable')
  async disableTruck(@Param('id') id: string): Promise<TruckDTO> {
    const truck = await this.truckService.disableTruck(id);
    return TruckDTO.fromModel(truck);
  }

  @ApiOperation({
    summary: 'Remove a Truck',
    description: 'Allows an Owner to remove one of its trucks',
  })
  @ApiAcceptedResponse({
    description: 'Deleted Truck',
    type: Boolean,
  })
  @UseGuards(OwnsTruck)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.truckService.remove(id);
  }

  @ApiOperation({ summary: 'Get Total Trucks' })
  @ApiAcceptedResponse({
    description: 'Got Total Trucks',
    type: TruckTotalsDTO,
  })
  @Get('all-totals')
  async getTotal(@CurrentUser() user: User): Promise<TruckTotalsDTO> {
    const activeTrucks = await this.truckService.countAllOwnerActiveTrucks(
      user,
    );
    const notActiveTrucks = await this.truckService.countAllOwnerNotActiveTrucks(
      user,
    );
    const total = activeTrucks + notActiveTrucks;
    return {
      active: activeTrucks,
      inactive: notActiveTrucks,
      total,
    };
  }

  @ApiOperation({ summary: 'Get Inspections Overview' })
  @ApiAcceptedResponse({
    description: 'Got Inspections Overview',
    type: TruckInspectionDTO,
  })
  @Get('inspections-overview/:ownerId/:start/:end')
  async getInspectionsOverview(
    @Param('ownerId') ownerId: string,
      @Param('start') start: string,
      @Param('end') end: string,
  ): Promise<TruckInspectionDTO> {
    return this.truckService.getInspectionsOverview(ownerId, start, end);
  }

  @ApiOperation({ summary: 'Get Inspections History' })
  @ApiAcceptedResponse({
    description: 'Got Inspections History',
    type: TruckInspectionDTO,
  })
  @Get('inspections-history/:ownerId')
  async getInspectionsHistory(
    @Param('ownerId') ownerId: string,
  ): Promise<TruckInspectionDTO> {
    return this.truckService.getInspectionsHistory(ownerId);
  }

  @ApiOperation({ summary: 'Get Defects History' })
  @ApiAcceptedResponse({
    description: 'Got Defects History',
    type: DefectsDTO,
  })
  @Get('defects-history/:ownerId/:start/:end')
  async getDefectsHistory(
    @Param('ownerId') ownerId: string,
      @Param('start') start: string,
      @Param('end') end: string,
  ): Promise<DefectsDTO[]> {
    return this.truckService.getDefectsHistory(ownerId, start, end);
  }

  @ApiOperation({ summary: 'Get Maintenance History' })
  @ApiAcceptedResponse({
    description: 'Got Maintenance History',
    type: MaintenanceDTO,
  })
  @Get('maintenance-history/:ownerId')
  async getMaintenanceHistory(
    @Param('ownerId') ownerId: string,
  ): Promise<MaintenanceDTO> {
    return this.truckService.getMaintenanceHistory(ownerId);
  }

  @ApiOperation({ summary: 'Get Expenses History' })
  @ApiAcceptedResponse({
    description: 'Got Expenses History',
    type: ExpensesDTO,
  })
  @Get('expenses-history/:ownerId/:start/:end')
  async getExpensesHistory(
    @Param('ownerId') ownerId: string,
      @Param('start') start: string,
      @Param('end') end: string,
  ): Promise<ExpensesDTO> {
    return this.truckService.getExpensesHistory(ownerId, start, end);
  }

  @ApiOperation({ summary: 'Get Truck Inspection' })
  @ApiAcceptedResponse({
    description: 'Got Inspection',
    type: TruckInspectionDTO,
  })
  @Get('inspection/:id')
  async getInspection(@Param('id') id: number): Promise<TruckInspectionDTO> {
    return this.truckService.getInspectionByNumber(id);
  }

  @ApiOperation({ summary: 'Get Truck Defect' })
  @ApiAcceptedResponse({
    description: 'Got Defect',
  })
  @Get('defect/:id')
  async getDefect(@Param('id') id: number): Promise<DefectDTO> {
    return this.truckService.getDefectByNumber(id);
  }

  @ApiOperation({ summary: 'Update Defect Status' })
  @ApiAcceptedResponse({
    description: 'Switched Defect Status',
  })
  @Post('asset/:id')
  async updateAssetStatus(
    @Param('id') assetNumber: number,
      @Body('status') status: string,
  ): Promise<void> {
    return this.truckService.updateDefectStatusByNumber(assetNumber, status);
  }

  @ApiOperation({ summary: 'Get a Work Order' })
  @ApiAcceptedResponse({
    description: 'Got Work Order',
    type: WorkOrderDTO,
  })
  @Get('work-order/:workOrderId/view')
  async getWorkOrder(@Param('workOrderId') workOrderId: string): Promise<any> {
    const foundWorkOrder = await this.truckService.getWorkOrder(workOrderId);
    return foundWorkOrder;
  }

  @ApiOperation({ summary: 'Get a Task Order' })
  @ApiAcceptedResponse({
    description: 'Got Task Order',
    type: TaskOrderDTO,
  })
  @Get('task-order/:taskOrderId/view')
  async getTaskOrder(@Param('taskOrderId') taskOrderId: string): Promise<any> {
    const foundTaskOrder = await this.truckService.getTaskOrder(taskOrderId);
    return foundTaskOrder;
  }

  @ApiOperation({ summary: 'Create a Work Order with a Defect' })
  @ApiAcceptedResponse({
    description: 'Created Work Order for a Defect',
    type: WorkOrderDTO,
  })
  @Post('work-order/:assetNumber/:truckId/create-for-defect')
  async generateWorkOrderForDefect(
    @Body() workOrder: WorkOrderType,
      @Param('assetNumber') assetNumber: number,
      @Param('truckId') truckId: string,
      @CurrentUser() user: User,
  ): Promise<any> {
    const assets = await this.assetsRepo.getDefectByNumber(assetNumber);
    const truck = await this.truckRepo.findById(truckId);
    const newWorkOrder = await this.truckService.createWorkOrderWithDefect(
      workOrder,
      assets,
      truck,
      user,
    );
    return newWorkOrder;
  }

  @ApiOperation({ summary: 'Create a Work Order with a Task Order' })
  @ApiAcceptedResponse({
    description: 'Created Work Order for a Task Order',
    type: WorkOrderDTO,
  })
  @Post('work-order/:taskOrderId/:truckId/create-for-task-order')
  async generateWorkOrderForTaskOrder(
    @Body() workOrder: WorkOrderType,
      @Param('taskOrderId') taskOrderId: string,
      @Param('truckId') truckId: string,
      @CurrentUser() user: User,
  ): Promise<any> {
    const taskOrder = await this.taskOrderRepo.findById(taskOrderId);
    const truck = await this.truckRepo.findById(truckId);
    const newWorkOrder = await this.truckService.createWorkOrderWithTaskOrder(
      workOrder,
      taskOrder,
      truck,
      user,
    );
    console.info(taskOrder);
    console.info(newWorkOrder);
    return newWorkOrder;
  }

  @ApiOperation({ summary: 'Create a Work Order Item' })
  @ApiAcceptedResponse({
    description: 'Created Work Order Item',
    type: WorkOrderItemDTO,
  })
  @Post('work-order/items/:workOrderId/create')
  async generateWorkOrderItem(
    @Body() workOrderItem: WorkOrderItemsType,
      @Param('workOrderId') workOrderId: string,
      @CurrentUser() user: User,
  ): Promise<any> {
    const foundTruck = await this.truckRepo.findById(workOrderItem.truckId);
    const newWorkOrderItem = await this.truckService.createWorkOrderItem(
      workOrderItem,
      workOrderId,
      foundTruck,
      user,
    );
    return newWorkOrderItem;
  }

  @ApiOperation({ summary: 'Create a Task Order' })
  @ApiAcceptedResponse({
    description: 'Created Task Order',
    type: TaskOrderDTO,
  })
  @Post('task-order/:truckId/create')
  async generateTaskOrder(
    @Body() taskOrder: TaskOrderType,
      @Param('truckId') truckId: string,
      @CurrentUser() user: User,
  ): Promise<any> {
    const foundTruck = await this.truckRepo.findById(truckId);
    foundTruck.miles = taskOrder.currentMiles;
    await this.truckRepo.save(foundTruck);
    await this.taskOrderRepo.editTaskOrdersCurrentMilesByTruckId(
      taskOrder.currentMiles,
      truckId,
    );
    const newTaskOrder = await this.truckService.createTaskOrder(
      taskOrder,
      foundTruck,
      user,
    );
    return newTaskOrder;
  }

  @ApiOperation({ summary: 'Delete Work Order Item' })
  @ApiAcceptedResponse({
    description: 'Delete Work Order Item',
  })
  @Delete('work-order/items/:workOrderItemId/delete')
  async deleteWorkOrderItem(
    @Param('workOrderItemId') workOrderItemId: string,
  ): Promise<any> {
    return this.workOrderItemsRepo.remove(workOrderItemId);
  }

  @ApiOperation({ summary: 'Delete Task Order' })
  @ApiAcceptedResponse({
    description: 'Deleted Task Order',
  })
  @Delete('task-order/:taskOrderId/delete')
  async deleteTaskOrder(
    @Param('taskOrderId') taskOrderId: string,
  ): Promise<any> {
    const foundTaskOrder = await this.taskOrderRepo.findById(taskOrderId);
    foundTaskOrder.isDeleted = true;
    return this.taskOrderRepo.save(foundTaskOrder);
  }

  @ApiOperation({ summary: 'Edit Work Order' })
  @ApiAcceptedResponse({
    description: 'Edit Work Order',
  })
  @Post('work-order/:workOrderId/edit')
  async editWorkOrder(
    @Body() workOrder: WorkOrderType,
      @Param('workOrderId') workOrderId: string,
  ): Promise<any> {
    const truckId = await this.workOrderRepo.getTruckIdByWorkOrderId(
      workOrderId,
    );
    const foundTruck = await this.truckRepo.findById(truckId);
    foundTruck.miles = workOrder.miles;
    await this.truckRepo.save(foundTruck);
    await this.taskOrderRepo.editTaskOrdersCurrentMilesByTruckId(
      workOrder.miles,
      truckId,
    );
    return this.truckService.editWorkOrder(workOrderId, workOrder);
  }

  @ApiOperation({ summary: 'Edit Work Order Item' })
  @ApiAcceptedResponse({
    description: 'Edit Work Order Item ',
  })
  @Post('work-order/items/:workOrderItemId/edit')
  async editWorkOrderItem(
    @Body() workOrderItem: WorkOrderItemsType,
      @Param('workOrderItemId') workOrderItemId: string,
  ): Promise<any> {
    return this.truckService.editWorkOrderItem(workOrderItemId, workOrderItem);
  }

  @ApiOperation({ summary: 'Edit Task Order' })
  @ApiAcceptedResponse({
    description: 'Edit Task Order',
  })
  @Post('task-order/:taskOrderId/edit')
  async editTaskOrder(
    @Body() taskOrder: TaskOrderType,
      @Param('taskOrderId') taskOrderId: string,
  ): Promise<any> {
    const truckId = await this.taskOrderRepo.getTruckIdByTaskOrderId(
      taskOrderId,
    );
    const foundTruck = await this.truckRepo.findById(truckId);
    foundTruck.miles = taskOrder.currentMiles;
    await this.truckRepo.save(foundTruck);
    return this.truckService.editTaskOrder(taskOrderId, taskOrder);
  }

  @ApiOperation({ summary: 'Update Work Order Status' })
  @ApiAcceptedResponse({
    description: 'Switched Work Order Status',
  })
  @Post('work-order/:workOrderId/switch-status')
  async updateWorkOrderStatus(
    @Body() workOrderStatus: WorkOrderType,
      @Param('workOrderId') workOrderId: string,
      @CurrentUser() user: User,
  ): Promise<any> {
    return this.truckService.updateWorkOrderStatus(
      workOrderId,
      workOrderStatus,
      user,
    );
  }

  @ApiOperation({ summary: 'Update Task Order Status' })
  @ApiAcceptedResponse({
    description: 'Switched Task Order Status',
  })
  @Post('task-order/:taskOrderId/switch-status')
  async updateTaskOrderStatus(
    @Param('taskOrderId') taskOrderId: string,
      @Body('status') status: string,
      @CurrentUser() user: User,
  ): Promise<any> {
    return this.truckService.updateTaskOrderStatus(taskOrderId, status, user);
  }

  @ApiOperation({ summary: 'Get Drivers Board Inspection List' })
  @ApiAcceptedResponse({
    description: 'Got Drivers Board Inspection List',
    type: DriversBoardDTO,
  })
  @Get('drivers-board/:ownerId/:start/:end')
  async getDriversBoardList(
    @Param('ownerId') ownerId: string,
      @Param('start') start: string,
      @Param('end') end: string,
  ): Promise<DriversBoardDTO> {
    return this.truckService.getDriversBoardInspectionList(ownerId, start, end);
  }

  @ApiOperation({ summary: "Get Driver's Board List" })
  @ApiAcceptedResponse({
    description: "Got Driver's Board List",
    type: DriverBoardDTO,
  })
  @Get('driver-board/:driverId/:start/:end')
  async getDriverBoardList(
    @Param('driverId') driverId: string,
      @Param('start') start: string,
      @Param('end') end: string,
  ): Promise<DriverBoardDTO> {
    return this.truckService.getDriverBoardList(driverId, start, end);
  }

  @ApiOperation({ summary: 'Get Trucks Board Inspection List' })
  @ApiAcceptedResponse({
    description: 'Got Trucks Board Inspection List',
    type: TrucksBoardDTO,
  })
  @Get('trucks-board/:ownerId/:start/:end')
  async getTrucksBoardList(
    @Param('ownerId') ownerId: string,
      @Param('start') start: string,
      @Param('end') end: string,
  ): Promise<TrucksBoardDTO> {
    return this.truckService.getTrucksBoardInspectionList(ownerId, start, end);
  }

  @ApiOperation({ summary: "Get Truck's Board List" })
  @ApiAcceptedResponse({
    description: "Got Truck's Board List",
    type: TruckBoardDTO,
  })
  @Get('truck-board/:truckId/:start/:end/')
  async getTruckBoardList(
    @Query('byPeriod') byPeriod,
      @Param('truckId') truckId: string,
      @Param('start') start: string,
      @Param('end') end: string,
  ): Promise<TruckBoardDTO> {
    if (byPeriod === 'false') {
      start = null;
      end = null;
    }
    return this.truckService.getTruckBoardList(truckId, start, end);
  }

  @ApiOperation({ summary: 'Update Truck Miles' })
  @ApiAcceptedResponse({
    description: 'Updated Truck Miles',
  })
  @Post('truck-board/:truckId/edit-miles')
  async updateTruckMiles(
    @Param('truckId') truckId: string,
      @Body() data: UpdateTruckDTO,
  ): Promise<any> {
    const foundTruck = await this.truckRepo.findById(truckId);
    foundTruck.miles = data.miles;
    await this.truckRepo.save(foundTruck);
    await this.taskOrderRepo.editTaskOrdersCurrentMilesByTruckId(
      data.miles,
      truckId,
    );

    return foundTruck;
  }
}
