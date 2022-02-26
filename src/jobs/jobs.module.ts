import { Module } from '@nestjs/common';
import { JobsCommonModule } from './jobs-common.module';
import { WeeklyModule } from './controllers/otherWeekly/weekly.module';
import { JobContractorModule } from './controllers/contractor/job-contractor.module';
import { JobOwnerModule } from './controllers/owner/job-owner.module';
import { JobDriverModule } from './controllers/driver/job-driver.module';
import { JobAdminModule } from './controllers/admin/job-admin.module';
import { JobDispatcherModule } from './controllers/dispatcher/job-dispatcher.module';
import { JobForemanModule } from './controllers/foreman/job-foreman.module';

@Module({
  imports: [
    JobsCommonModule,
    JobContractorModule,
    JobOwnerModule,
    JobDriverModule,
    JobAdminModule,
    JobDispatcherModule,
    JobForemanModule,
    WeeklyModule,
  ],
  exports: [JobsCommonModule],
})
export class JobsModule {}
