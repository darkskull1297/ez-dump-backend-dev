import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JobsService } from '../jobs/jobs.service';
import { JobRepo } from '../jobs/job.repository';
import { UserModule } from '../user/user.module';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { LocationModule } from '../location/location.module';
import { EmailModule } from '../email/email.module';
import { GeneralJobRepo } from './general-job.repository';
import { JobAssignationRepo } from '../jobs/job-assignation.repository';
import { GeneralJob } from './general-job.model';
import { TrucksModule } from '../trucks/trucks.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { TimerModule } from '../timer/timer.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { Job } from '../jobs/job.model';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { JobAssignation } from '../jobs/job-assignation.model';
import { GeneralJobService } from './general-job.service';
import { NotificationModule } from '../notification/notification.module';
import { SwitchJobModule } from '../switch-job/switch-job-module';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { RequestTruck } from '../jobs/request-truck.model';
import { RequestTruckRepo } from '../jobs/request-truck.repository';
import { CompanyModule } from '../company/company.module';
import { MaterialsRepo } from '../jobs/materials.repository';
import { JobsModule } from '../jobs/jobs.module';
import { MaterialRepo } from './material.repository';
import { Material } from './material.model';
import { CustomerModule } from '../customer/customer.module';
import { CustomerRepo } from '../customer/customer.repository';
import { Customer } from '../customer/customer.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      ScheduledJob,
      JobAssignation,
      GeneralJob,
      RequestTruck,
      Material,
      Customer,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UserModule),
    TrucksModule,
    LocationModule,
    EmailModule.forChild(),
    forwardRef(() => CompanyModule),
    forwardRef(() => InvoicesModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => GeolocationModule),
    TimerModule,
    ReviewsModule,
    SwitchJobModule,
    forwardRef(() => JobsModule),
    CustomerModule,
  ],
  providers: [
    JobsService,
    JobRepo,
    RequestTruckRepo,
    ScheduledJobRepo,
    GeneralJobRepo,
    JobAssignationRepo,
    GeneralJobService,
    RequestTruckRepo,
    MaterialsRepo,
    MaterialRepo,
    CustomerRepo,
  ],
  exports: [
    JobsService,
    JobRepo,
    RequestTruckRepo,
    ScheduledJobRepo,
    GeneralJobRepo,
    JobAssignationRepo,
    GeneralJobService,
    MaterialRepo,
  ],
})
export class GeneralJobCommonModule {}
