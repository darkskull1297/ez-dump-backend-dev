import { forwardRef, Module } from '@nestjs/common';
import { JobDispatcherController } from './job-dispatcher.controller';
import { JobsCommonModule } from '../../jobs-common.module';
import { UserModule } from '../../../user/user.module';
import { UserRepo } from '../../../user/user.repository';
import { CompanyModule } from '../../../company/company.module';

@Module({
  imports: [
    JobsCommonModule,
    forwardRef(() => UserModule),
    forwardRef(() => CompanyModule),
  ],
  providers: [UserRepo],
  controllers: [JobDispatcherController],
})
export class JobDispatcherModule {}
