/* eslint-disable */
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Notification } from './notifications.interface';
import { NotificationRepo } from '../notification.repository';
import { UserRepo } from '../../user/user.repository';

@WebSocketGateway(5050)
export class NotificationGateway implements OnGatewayInit {
  constructor(
    private readonly notificationRepo: NotificationRepo,
    private readonly userRepo: UserRepo,
  ) {}

  private logger: Logger = new Logger('NotificationGateway');

  afterInit(server: Server): void {
    this.logger.log('Notification gateway initialized!');
  }

  @WebSocketServer()
  server: Server;

  private connectedUsers: string[] = [];
  private mapJobActive = new Set<string>();
  private notificationList: Notification[] = [];
  private pendingAutoPunchs = new Set<string>();
  private pendingAutoPunchsCron = new Set<string>();

  @SubscribeMessage('listenNotifications')
  async listenConnectUser(client: Socket, { userId }): Promise<void> {
    client.join(`user-connect/${userId}`);
    const user = await this.userRepo.findOne({ id: userId });

    this.notificationList = await this.notificationRepo.getNotifications(user);
    this.server
      .to(`user-connect/${userId}`)
      .emit('user-connect', this.notificationList);

    if (this.pendingAutoPunchs.has(userId)) {
      this.pendingAutoPunchs.delete(userId);
      this.server.to(`user-connect/${userId}`).emit('autoPunchOut', userId);
    }

    if (this.pendingAutoPunchsCron.has(userId)) {
      this.pendingAutoPunchsCron.delete(userId);
      this.server
        .to(`user-connect/${userId}`)
        .emit('autoPunchOutByCron', userId);
    }

    if (this.connectedUsers.includes(userId)) return;

    this.connectedUsers.push(userId);
  }

  @SubscribeMessage('updateLoad')
  updateLoadForJob({ jobId, userId, loads }): void {
    this.server.to(`user-connect/${userId}`).emit('loads-update', {
      jobId,
      loads,
    });
  }

  @SubscribeMessage('leaveNotifications')
  leaveConnectUser(client: Socket, { userId }): void {
    this.connectedUsers = this.connectedUsers.filter(id => id !== userId);

    client.leave(`user-connect/${userId}`);
  }

  @SubscribeMessage('sendSocketNotification')
  updateNotifications(notification: Notification, userId: string): void {
    console.log('Sending notification message!');
    this.server.to(`user-connect/${userId}`).emit('message', notification);
  }

  @SubscribeMessage('autoPunchOut')
  autoPunchOut(userId: string): void {
    console.log('Auto Punch Out!', userId);
    this.pendingAutoPunchs.add(userId);
    this.server.to(`user-connect/${userId}`).emit('autoPunchOut', userId);
  }

  @SubscribeMessage('autoPunchOutByCron')
  autoPunchOutByCron(userId: string): void {
    console.log('Auto Punch Out By Cron!', userId);
    this.pendingAutoPunchsCron.add(userId);
    this.server.to(`user-connect/${userId}`).emit('autoPunchOutByCron', userId);
  }

  @SubscribeMessage('receivedPunchOut')
  receivePunch(client: Socket, { userId }): void {
    this.pendingAutoPunchs.delete(userId);
    this.pendingAutoPunchsCron.delete(userId);
  }

  /** cancel active job */
  @SubscribeMessage('listenJobsActive')
  async listenJobsActive(client: Socket, { userId, jobId }): Promise<void> {
    try {
      if (userId) {
        client.join(`job-active-connect/${userId}/${jobId}`);
        this.mapJobActive.add(JSON.stringify({ userId, jobId }));
        const user = await this.userRepo.findOne({ id: userId });

        if (user.role === 'DRIVER') {
          const jobNotifications = await this.notificationRepo.getJobNotification(
            jobId,
          );
          this.server
            .to(`job-active-connect/${userId}/${jobId}`)
            .emit('job-active-connect', jobNotifications);
        }
      } else {
        this.server
          .to(`job-active-connect/${userId}/${jobId}`)
          .emit('job-active-connect', 'job socket connected!');
      }
    } catch (err) {
      return err;
    }
  }

  @SubscribeMessage('cancelActiveJob')
  cancelActiveJob(
    cancelJob: boolean,
    currentJobId: string,
    message: string,
    driverId: string,
    isAutomaticallyFinished?: boolean,
  ): void {
    // eslint-disable-next-line no-unused-expressions

    this.mapJobActive.forEach(value => {
      const { userId, jobId } = JSON.parse(value);
      if (
        currentJobId === jobId &&
        (userId === driverId || driverId === 'all')
      ) {
        // this.mapJobActive.delete({ userId, jobId });
        this.server
          .to(`job-active-connect/${userId}/${jobId}`)
          .emit('job-active-connect', [
            {
              cancelJob,
              message,
              isAutomaticallyFinished,
              currentJobId,
              userId,
            },
          ]);
      }
    });
  }

  @SubscribeMessage('updateJob')
  updateJob(targetJob: string): void {
    this.mapJobActive.forEach(val => {
      const { userId, jobId } = JSON.parse(val);
      if (jobId === targetJob) {
        this.server
          .to(`job-active-connect/${userId}/${jobId}`)
          .emit('update-job');
      }
    });
  }

  @SubscribeMessage('deleteJobNotification')
  deleteJobNotification(client: Socket, data): void {
    if (data?.jobID && data?.userID) {
      this.notificationRepo.deleteJobNotification(data?.jobID, data?.userID);
      this.mapJobActive.forEach(value => {
        const { jobId, userId } = JSON.parse(value);
        if (jobId === data?.jobID && userId === data?.userID) {
          client.leave(`user-connect/${userId}/${data?.jobID}`);
          this.mapJobActive.delete(value);
        }
      });
    }
  }

  @SubscribeMessage('leaveJobActiveSocket')
  leaveConnectJobUser(client: Socket, { userId, jobId }): void {
    const value = JSON.stringify({ userId, jobId });
    this.mapJobActive.delete(value);

    client.leave(`user-connect/${userId}`);
  }
}
