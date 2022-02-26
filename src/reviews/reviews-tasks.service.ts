import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReviewsService } from './reviews.service';

@Injectable()
export class ReviewsTasksService {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Cron('0 0 0 * * *')
  handleCron(): void {
    this.reviewsService.rateZeroScheduledJobsNotStarted();
  }
}
