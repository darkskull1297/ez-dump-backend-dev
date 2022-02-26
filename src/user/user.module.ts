import { Module } from '@nestjs/common';
import { UserCommonModule } from './user-common.module';
import { UserDriverModule } from './controllers/driver/user-driver.module';
import { UserOwnerModule } from './controllers/owner/user-owner.module';
import { UserAdminModule } from './controllers/admin/user-admin.module';
import { UserDispatcherModule } from './controllers/dispatcher/user-dispatcher.module';
import { S3Module } from '../s3/s3.module';
import { UserContractorModule } from './controllers/contractor/user-contractor.module';
import { UserForemanModule } from './controllers/foreman/user-foreman.module';

@Module({
  imports: [
    UserCommonModule,
    UserDriverModule,
    UserAdminModule,
    UserOwnerModule,
    UserContractorModule,
    UserForemanModule,
    UserDispatcherModule,
    S3Module,
  ],
  exports: [UserCommonModule],
})
export class UserModule {}
