import { Module } from '@nestjs/common';
import { SettingsCommonModule } from './settings-common.module';
import { TruckAdminModule } from './controllers/admin/settings-admin.module';

@Module({
  imports: [SettingsCommonModule, TruckAdminModule],
  exports: [SettingsCommonModule],
})
export class SettingsModule {}
