import { forwardRef, Module } from '@nestjs/common';
import { DispatcherNotificationsController } from './dispatcher.controller';
import { NotificationModule } from '../../notification.module';
import { Notification } from '../../notification.model';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [DispatcherNotificationsController],
})
export class DispatcherNotificationsModule {}
