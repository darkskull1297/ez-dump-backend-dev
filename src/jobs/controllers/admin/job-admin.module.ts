import { Module } from '@nestjs/common';
import { JobAdminController } from './job-admin.controller';
import { JobsCommonModule } from '../../jobs-common.module';

@Module({
  imports: [JobsCommonModule],
  controllers: [JobAdminController],
})
export class JobAdminModule {}
