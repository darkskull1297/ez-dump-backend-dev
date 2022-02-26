import { forwardRef, Module } from '@nestjs/common';
import { GeneralJobCommonModule } from '../../general-job-common.module';
import { GeneralJobForemanController } from './general-job-foreman.controller';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [GeneralJobCommonModule, forwardRef(() => UserModule)],
  controllers: [GeneralJobForemanController],
})
export class GeneralJobForemanModule {}
