import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { TimeEntryRepo } from './time-entry.repository';
import { TimerService } from './timer.service';
import { JobsModule } from '../jobs/jobs.module';
import { TimeEntry } from './time-entry.model';
import { S3Module } from '../s3/s3.module';
import { EmailModule } from '../email/email.module';
import { LocationModule } from '../location/location.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { NotificationModule } from '../notification/notification.module';
import { SwitchJobModule } from '../switch-job/switch-job-module';
import { UserModule } from '../user/user.module';
import { TrucksModule } from '../trucks/trucks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeEntry]),
    forwardRef(() => JobsModule),
    forwardRef(() => UserModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    S3Module,
    EmailModule.forChild(),
    LocationModule,
    SwitchJobModule,
    forwardRef(() => InvoicesModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => TrucksModule),
  ],
  providers: [TimeEntryRepo, TimerService],
  exports: [
    TimeEntryRepo,
    TimerService,
    TypeOrmModule,
    PassportModule,
    EmailModule,
  ],
})
export class TimerCommonModule {}
