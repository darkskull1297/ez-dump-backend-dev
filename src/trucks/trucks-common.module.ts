import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';
import { CompanyModule } from '../company/company.module';
import { TruckRepo } from './truck.repository';
import { Truck } from './truck.model';
import { TruckCategoryRepo } from './truck-category.repository';
import { TruckCategory } from './truck-category.model';
import { TruckService } from './truck.service';
import { TimerModule } from '../timer/timer.module';
import { TruckCategoryRequestTruckRepo } from './truck-category-request-truck.repository';
import { TruckCategoryRequestTruck } from './truck-category-request-truck.model';
import { UserModule } from '../user/user.module';
import { UserRepo } from '../user/user.repository';
import { TruckInspection } from './truck-inspection.model';
import { TruckInspectionRepo } from './truck-inspection.repository';
import { S3Module } from '../s3/s3.module';
import { S3Service } from '../s3/s3.service';
import { JobsModule } from '../jobs/jobs.module';
import { TruckPunch } from './truck-punch.model';
import { TruckPunchRepo } from './truck-punch.repository';
import { AssetsRepo } from './assets.repository';
import { Assets } from './assets.model';
import { TaskOrder } from './task-order.model'
import { TaskOrderRepo } from './task-order.repository';
import { WorkOrder } from './work-order.model'
import { WorkOrderRepo } from './work-order.repository';
import { WorkOrderItems } from './work-order-items.model'
import { WorkOrderItemsRepo } from './work-order-items.repository';
import { TruckLog } from './truck-log.model';
import { TruckLogRepo } from './truck-log.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Truck,
      TruckCategory,
      TruckCategoryRequestTruck,
      TruckInspection,
      TruckPunch,
      Assets,
      TaskOrder,
      WorkOrder,
      WorkOrderItems,
      TruckLog,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    CompanyModule,
    forwardRef(() => TimerModule),
    forwardRef(() => UserModule),
    forwardRef(() => JobsModule),
    S3Module,
  ],
  providers: [
    TruckRepo,
    TruckCategoryRepo,
    TruckService,
    TruckLogRepo,
    TruckCategoryRequestTruckRepo,
    TruckInspectionRepo,
    TruckPunchRepo,
    UserRepo,
    S3Service,
    AssetsRepo,
    TaskOrderRepo,
    WorkOrderRepo,
    WorkOrderItemsRepo,
  ],
  exports: [
    TruckRepo,
    TruckCategoryRepo,
    TruckCategoryRequestTruckRepo,
    TruckService,
    TruckInspectionRepo,
    PassportModule,
    TypeOrmModule,
    TruckPunchRepo,
    AssetsRepo,
    TaskOrderRepo,
    WorkOrderRepo,
    WorkOrderItemsRepo,
  ],
})
export class TrucksCommonModule {}
