import { StrictEventEmitter } from 'nest-emitter';
import { EventEmitter } from 'typeorm/platform/PlatformTools';
import { TextMessageInfo } from './text-message-notification-interface';
import { NotificationInfo } from './truck-location-info.interface';
import { Notification } from './notification.model';
import { Loads } from '../geolocation/loads.model';

interface NotificationEventsEvents {
  sendNotification: NotificationInfo;
  sendTextMessage: TextMessageInfo;
  sendSocketNotification: Notification;
  cancelActiveJob: {
    cancelJob: boolean;
    currentJobId: string;
    message: string;
    isAutomaticallyFinished: boolean;
    driverId: string;
  };
  updateLoad: {
    jobId: string;
    userId: string;
    loads: Loads[];
  };
  updateJob: string;
  autoPunchOut: string;
  autoPunchOutByCron: string;
}

export type NotificationEventEmitter = StrictEventEmitter<
EventEmitter,
NotificationEventsEvents
>;
