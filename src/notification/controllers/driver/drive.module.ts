import { forwardRef, Module } from '@nestjs/common';
import { DriverNotificationsController } from './driver.controller';
import { NotificationModule } from '../../notification.module';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [DriverNotificationsController],
})
export class DriverNotificationsModule {}
