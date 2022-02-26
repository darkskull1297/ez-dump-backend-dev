import { Module } from '@nestjs/common';
import { GeneralJobCommonModule } from './general-job-common.module';
import { GeneralJobContractorModule } from './controllers/contractor/general-job-contractor.module';
import { GeneralJobForemanModule } from './controllers/foreman/general-job-foreman.module';
import { GeneralJobDispatcherModule } from './controllers/dispatcher/general-job-dispatcher.module';
import { GeneralJobAdminModule } from './controllers/admin/general-job-admin.module';

@Module({
  imports: [
    GeneralJobCommonModule,
    GeneralJobContractorModule,
    GeneralJobForemanModule,
    GeneralJobDispatcherModule,
    GeneralJobAdminModule,
  ],
  exports: [GeneralJobCommonModule],
})
export class GeneralJobModule {}
