import { Module } from '@nestjs/common';
import { AuthCommonModule } from '../../auth-common.module';
import { AuthAdminController } from './auth-admin.controller';

@Module({
  imports: [AuthCommonModule],
  controllers: [AuthAdminController],
})
export class AuthAdminModule {}
