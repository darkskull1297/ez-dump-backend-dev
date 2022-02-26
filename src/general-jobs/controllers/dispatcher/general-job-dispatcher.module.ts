import { forwardRef, Module } from '@nestjs/common';
import { GeneralJobCommonModule } from '../../general-job-common.module';
import { GeneralJobDispatcherController } from './general-job-dispatcher.controller';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [GeneralJobCommonModule, forwardRef(() => UserModule)],
  controllers: [GeneralJobDispatcherController],
})
export class GeneralJobDispatcherModule {}
