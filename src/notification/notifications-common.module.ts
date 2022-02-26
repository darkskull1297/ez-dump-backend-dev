import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationEventsService } from './notification-events.service';
import { NotificationGateway } from './gateway/notifications.gateway';
import { NotificationRepo } from './notification.repository';
import { NotificationService } from './notification.service';
import { UserModule } from '../user/user.module';
import { Notification } from './notification.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    MessagingModule,
    UserModule,
  ],
  providers: [
    NotificationEventsService,
    NotificationService,
    NotificationGateway,
    NotificationRepo,
  ],
  exports: [NotificationEventsService, NotificationRepo, NotificationService],
})
export class NotificationsCommonModule {}
