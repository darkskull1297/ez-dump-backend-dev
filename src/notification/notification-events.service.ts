import admin from 'firebase-admin';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';
import { NotificationEventEmitter } from './notification.events';
import { NotificationInfo } from './truck-location-info.interface';
import { Notification } from './gateway/notifications.interface';
import { MessagingService } from '../messaging/messaging.service';
import { TextMessageInfo } from './text-message-notification-interface';
import { NotificationGateway } from './gateway/notifications.gateway';
import { Loads } from '../geolocation/loads.model';

@Injectable()
export class NotificationEventsService implements OnModuleInit {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
    private readonly messagingService: MessagingService,
  ) {}

  onModuleInit(): void {
    this.eventEmitter.on('sendNotification', data =>
      this.onSendNotification(data),
    );
    this.eventEmitter.on('sendTextMessage', data =>
      this.onSendTextMessag(data),
    );
    this.eventEmitter.on('sendSocketNotification', (notification, userID) =>
      this.onNotificationUpdated(notification, userID),
    );
    this.eventEmitter.on('autoPunchOut', userID => this.onAutoPunchOut(userID));
    this.eventEmitter.on('autoPunchOutByCron', userID =>
      this.onAutoPunchOutByCron(userID),
    );
    this.eventEmitter.on('cancelActiveJob', data =>
      this.onCancelJobActive(
        data.cancelJob,
        data.currentJobId,
        data.message,
        data.driverId,
        data.isAutomaticallyFinished,
      ),
    );
    this.eventEmitter.on('updateLoad', data =>
      this.onUpdateLoad(data.jobId, data.userId, data.loads),
    );
    this.eventEmitter.on('updateJob', data => {
      this.onUpdateJob(data);
    });
  }

  onUpdateJob(jobId: string): void {
    try {
      this.notificationGateway.updateJob(jobId);
    } catch (err) {
      console.error(err);
    }
  }

  onAutoPunchOut(userId: string): void {
    try {
      this.notificationGateway.autoPunchOut(userId);
    } catch (error) {
      console.log(error);
    }
  }

  onAutoPunchOutByCron(userId: string): void {
    try {
      this.notificationGateway.autoPunchOutByCron(userId);
    } catch (error) {
      console.log(error);
    }
  }

  onSendTextMessag(data: TextMessageInfo): void {
    try {
      this.messagingService.sendSMS(data);
    } catch (error) {
      console.log(error);
    }
  }

  onSendNotification(data: NotificationInfo): void {
    const payload = {
      notification: {
        title: data.title,
        body: data.body,
      },
    };

    console.info('Sending firebase notification: ', payload);
    console.info('Send to: ', data.to);

    try {
      admin
        .messaging()
        .sendToDevice(data.to, payload)
        .then(function(response) {
          console.log('Successfully sent message:', response);
        })
        .catch(function(error) {
          console.log('Error sending message:', error);
        });
    } catch (error) {
      console.log(error);
    }
  }

  onNotificationUpdated(data: Notification, userID: string): void {
    this.notificationGateway.updateNotifications(data, userID);
  }

  onCancelJobActive(
    cancelJob: boolean,
    currentJobId: string,
    message: string,
    driverId: string,
    isAutomaticallyFinished?: boolean,
  ): void {
    this.notificationGateway.cancelActiveJob(
      cancelJob,
      currentJobId,
      message,
      driverId,
      isAutomaticallyFinished,
    );
  }

  onUpdateLoad(jobId: string, userId: string, loads: Loads[]): void {
    this.notificationGateway.updateLoadForJob({ jobId, userId, loads });
  }
}
