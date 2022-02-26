import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserService } from './user.service';

@Injectable()
export class UserTasksService {
  constructor(private readonly userService: UserService) {}

  @Cron(CronExpression.EVERY_4_HOURS)
  handleUpdateUsersPriority(): void {
    this.userService.updateOwnersPriority();
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  overdueAssegunranza(): void {
    console.log('CRON Aseguranza');
    this.userService.reviewAssegunranza();
  }
}
