import { Module } from '@nestjs/common';
import { ForemanNotificationsModule } from './controllers/foreman/foreman.module';
import { AdminNotificationsModule } from './controllers/admin/admin.module';
import { NotificationsCommonModule } from './notifications-common.module';
import { ContractorNotificationsModule } from './controllers/contractor/contractor.module';
import { DispatcherNotificationsModule } from './controllers/dispatcher/dispatcher.module';
import { OwnerNotificationsModule } from './controllers/owner/owner.module';
import { DriverNotificationsModule } from './controllers/driver/drive.module';

@Module({
  imports: [
    NotificationsCommonModule,
    AdminNotificationsModule,
    ContractorNotificationsModule,
    DispatcherNotificationsModule,
    ForemanNotificationsModule,
    OwnerNotificationsModule,
    DriverNotificationsModule,
  ],
  exports: [NotificationsCommonModule],
})
export class NotificationModule {}
