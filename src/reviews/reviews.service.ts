import { Injectable } from '@nestjs/common';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { Truck } from '../trucks/truck.model';
import { User } from '../user/user.model';
import { ReviewTruck } from './review-truck.model';
import { ReviewTruckRepo } from './review-truck.repository';
import { Review } from './review.model';

import { ReviewsRepo } from './reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepo: ReviewsRepo,
    private readonly scheduledJobRepo: ScheduledJobRepo,
    private readonly reviewsTruckRepo: ReviewTruckRepo,
  ) {}

  async rateZeroScheduledJobsNotStarted(): Promise<void> {
    const scheduledJobs = await this.scheduledJobRepo.findMissedJobs();
    await Promise.all(
      scheduledJobs.map(async scheduledJob =>
        this.reviewUser(await scheduledJob.company.owner, {
          stars: 0,
          comment: 'Did not start job in time',
        }),
      ),
    );
  }

  reviewUser(
    user: User,
    { stars, comment }: { stars: number; comment: string },
  ): Promise<Review> {
    return this.reviewsRepo.create({ user, stars, comment });
  }

  getTruckReviews(truck: Truck): Promise<ReviewTruck[]> {
    return this.reviewsTruckRepo.findTruckReviews(truck);
  }
}
