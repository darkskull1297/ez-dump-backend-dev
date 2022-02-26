import { forwardRef, Module } from '@nestjs/common';
import { GeneralJobCommonModule } from '../../general-job-common.module';
import { GeneralJobAdminController } from './general-job-admin.controller';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [GeneralJobCommonModule, forwardRef(() => UserModule)],
  controllers: [GeneralJobAdminController],
})
export class GeneralJobAdminModule {}
