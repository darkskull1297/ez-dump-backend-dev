import { forwardRef, Module } from '@nestjs/common';
import { JobDriverController } from './job-driver.controller';
import { JobsCommonModule } from '../../jobs-common.module';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [JobsCommonModule, forwardRef(() => UserModule)],
  controllers: [JobDriverController],
})
export class JobDriverModule {}
