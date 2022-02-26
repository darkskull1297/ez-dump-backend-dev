import { forwardRef, Module } from '@nestjs/common';
import { OwnerNotificationsController } from './owner.controller';
import { NotificationModule } from '../../notification.module';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [OwnerNotificationsController],
})
export class OwnerNotificationsModule {}
