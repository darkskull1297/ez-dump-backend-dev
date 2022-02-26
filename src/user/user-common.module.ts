import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { User } from './user.model';
import { CompanyModule } from '../company/company.module';
import { UserRepo } from './user.repository';
import { UserService } from './user.service';
import { S3Module } from '../s3/s3.module';
import { Owner } from './owner.model';
import { Admin } from './admin.model';
import { Driver } from './driver.model';
import { Contractor } from './contractor.model';
import { OwnerRepo } from './owner.repository';
import { OwnerCompanyRepo } from '../company/owner-company.repository';
import { AdminRepo } from './admin.repository';
import { DriverRepo } from './driver.repository';
import { ContractorRepo } from './contractor.repository';
import { StripeModule } from '../stripe/stripe.module';
import { EmailModule } from '../email/email.module';
import { TimerModule } from '../timer/timer.module';
import { JobsModule } from '../jobs/jobs.module';
import { DispatcherRepo } from './dispatcher.repository';
import { ForemanRepo } from './foreman.repository';
import { Foreman } from './foreman.model';
import { Dispatcher } from './dispatcher.model';
import { UserTasksService } from './user-tasks.service';
import { TrucksModule } from '../trucks/trucks.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { NotificationModule } from '../notification/notification.module';
import { NotificationService } from '../notification/notification.service';
import { UserLog } from './user-log.model';
import { UserLogRepo } from './user-log.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Owner,
      Admin,
      Driver,
      Contractor,
      Dispatcher,
      Foreman,
      UserLog,
    ]),
    CompanyModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    S3Module,
    StripeModule,
    EmailModule.forChild(),
    forwardRef(() => TimerModule),
    forwardRef(() => JobsModule),
    forwardRef(() => NotificationModule),
    TrucksModule,
    ReviewsModule,
  ],
  providers: [
    UserService,
    UserRepo,
    OwnerRepo,
    OwnerCompanyRepo,
    UserLogRepo,
    AdminRepo,
    DriverRepo,
    ContractorRepo,
    DispatcherRepo,
    ForemanRepo,
    UserTasksService,
    NotificationService,
  ],
  exports: [
    UserService,
    UserRepo,
    OwnerRepo,
    OwnerCompanyRepo,
    AdminRepo,
    DriverRepo,
    ContractorRepo,
    DispatcherRepo,
    ForemanRepo,
    PassportModule,
    TypeOrmModule,
    EmailModule,
    UserTasksService,
    NotificationService,
  ],
})
export class UserCommonModule {}
