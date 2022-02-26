import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { Job } from './job.model';
import { RequestTruck } from './request-truck.model';
import { JobsService } from './jobs.service';
import { JobRepo } from './job.repository';
import { UserModule } from '../user/user.module';
import { TrucksModule } from '../trucks/trucks.module';
import { ScheduledJob } from './scheduled-job.model';
import { ScheduledJobRepo } from './scheduled-job.repository';
import { JobAssignationRepo } from './job-assignation.repository';
import { RequestTruckRepo } from './request-truck.repository';
import { JobAssignation } from './job-assignation.model';
import { LocationModule } from '../location/location.module';
import { EmailModule } from '../email/email.module';
import { JobsTasksService } from './job-tasks.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { TimerModule } from '../timer/timer.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { GeneralJobModule } from '../general-jobs/general-job.module';
import { GeneralJobService } from '../general-jobs/general-job.service';
import { GeneralJob } from '../general-jobs/general-job.model';
import { NotificationModule } from '../notification/notification.module';
import { UserCommonModule } from '../user/user-common.module';
import { UserService } from '../user/user.service';
import { S3Module } from '../s3/s3.module';
import { StripeModule } from '../stripe/stripe.module';
import { SwitchJobModule } from '../switch-job/switch-job-module';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { JobInvoiceService } from '../invoices/job-invoice.service';
import { JobNotification } from './job-notification.model';
import { JobNotificationRepo } from './job-notification.repository';
import { CompanyModule } from '../company/company.module';
import { Materials } from './materials.model';
import { MaterialsRepo } from './materials.repository';
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
      JobNotification,
      Materials,
      Customer,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => CompanyModule),
    forwardRef(() => UserCommonModule),
    forwardRef(() => UserModule),
    forwardRef(() => GeolocationModule),
    TrucksModule,
    LocationModule,
    EmailModule.forChild(),
    forwardRef(() => InvoicesModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => StripeModule),
    TimerModule,
    ReviewsModule,
    S3Module,
    SwitchJobModule,
    forwardRef(() => GeneralJobModule),
    CustomerModule,
  ],
  providers: [
    UserService,
    JobInvoiceService,
    JobsService,
    JobRepo,
    JobNotificationRepo,
    ScheduledJobRepo,
    JobAssignationRepo,
    RequestTruckRepo,
    JobsTasksService,
    GeneralJobModule,
    GeneralJobService,
    MaterialsRepo,
    CustomerRepo,
  ],
  exports: [
    JobsService,
    JobRepo,
    JobAssignationRepo,
    RequestTruckRepo,
    ScheduledJobRepo,
    PassportModule,
    TypeOrmModule,
    JobsTasksService,
    GeneralJobModule,
    GeneralJobService,
    JobNotificationRepo,
    MaterialsRepo,
  ],
})
export class JobsCommonModule {}
