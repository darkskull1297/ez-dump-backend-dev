import { Module } from '@nestjs/common';
import { AuthCommonModule } from './auth-common.module';
import { AuthOwnerModule } from './controllers/owner/auth-owner.module';
import { AuthContractorModule } from './controllers/contractor/auth-contractor.module';
import { AuthAdminModule } from './controllers/admin/auth-admin.module';
import { AuthDriverModule } from './controllers/driver/auth-driver.module';
import { AuthDispatcherModule } from './controllers/dispatcher/auth-dispatcher.module';
import { AuthForemanModule } from './controllers/foreman/auth-foreman.module';

@Module({
  imports: [
    AuthCommonModule,
    AuthOwnerModule,
    AuthDriverModule,
    AuthContractorModule,
    AuthAdminModule,
    AuthDispatcherModule,
    AuthForemanModule,
  ],
})
export class AuthModule {}
