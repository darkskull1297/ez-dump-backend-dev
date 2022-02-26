import { Module } from '@nestjs/common';
import { SettingsAdminController } from './settings-admin.controller';
import { SettingsCommonModule } from '../../settings-common.module';

@Module({
  imports: [SettingsCommonModule],
  controllers: [SettingsAdminController],
})
export class TruckAdminModule {}
