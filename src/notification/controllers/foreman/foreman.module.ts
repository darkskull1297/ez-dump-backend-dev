import { forwardRef, Module } from '@nestjs/common';
import { ForemanNotificationsController } from './foreman.controller';
import { NotificationModule } from '../../notification.module';
import { Notification } from '../../notification.model';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [ForemanNotificationsController],
})
export class ForemanNotificationsModule {}
