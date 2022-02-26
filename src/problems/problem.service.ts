import { Injectable } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';
import { UserRole, User } from '../user/user.model';
import { ProblemReported } from '../notification/notifications/notifications';
import { NotificationService } from '../notification/notification.service';
import { ProblemRepo } from './problem.repository';
import { Problem } from './problem.model';
import { JobRepo } from '../jobs/job.repository';
import { NotificationEventEmitter } from '../notification/notification.events';
import { EmailService } from '../email/email.service';
import { Driver } from '../user/driver.model';
import { UserRepo } from '../user/user.repository';
import { ReportProblem } from '../notification/notifications/messages';

@Injectable()
export class ProblemService {
  constructor(
    private problemRepo: ProblemRepo,
    private readonly jobRepo: JobRepo,
    private readonly userRepo: UserRepo,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  getProblem(id: string): Promise<Problem> {
    return this.problemRepo.findById(id);
  }

  async create(
    problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt' | 'job'>,
    user: User,
    jobId: string,
  ): Promise<void> {
    const job = await this.jobRepo.findById(jobId);
    const newProblem = await this.problemRepo.create({
      ...problem,
      job,
      user,
    });
    const owner = await (user as Driver).drivingFor.owner;
    let todeviceID = '';

    const admin = await this.userRepo.find({
      role: UserRole.ADMIN,
    });

    // eslint-disable-next-line guard-for-in
    for (const key in admin) {
      const element = admin[key];

      const notification = await this.notificationService.createNotification({
        ...ProblemReported(job.name, user.name, problem.description),
        userId: element.id,
      });

      this.eventEmitter.emit('sendTextMessage', {
        to: element.phoneNumber,
        ...ReportProblem(job.name, user.name, problem.description),
      });

      this.eventEmitter.emit(
        'sendSocketNotification',
        notification,
        element.id,
      );
    }

    if (owner.deviceID) {
      todeviceID = owner.deviceID;
    }
    if (todeviceID.length > 0) {
      this.eventEmitter.emit('sendNotification', {
        to: todeviceID,
        title: `Problem with job ${job.name} !`,
        body: `There was a problem reported by ${user.name}. Problem subject: ${newProblem.subject}. Problem description: ${newProblem.description}`,
      });
    }
    await this.emailService.sendNewProblemEmail(
      owner.email,
      job.name,
      user.name,
      newProblem.subject,
      newProblem.description,
    );
  }
}
