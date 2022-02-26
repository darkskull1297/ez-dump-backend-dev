import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from '../jobs/jobs.module';
import { ReviewTruck } from './review-truck.model';
import { ReviewTruckRepo } from './review-truck.repository';
import { Review } from './review.model';
import { ReviewsTasksService } from './reviews-tasks.service';
import { ReviewsRepo } from './reviews.repository';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    forwardRef(() => JobsModule),
    TypeOrmModule.forFeature([Review, ReviewTruck]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    ReviewsRepo,
    ReviewTruckRepo,
    ReviewsService,
    ReviewsTasksService,
  ],
  exports: [
    ReviewsRepo,
    ReviewTruckRepo,
    ReviewsService,
    ReviewsTasksService,
    TypeOrmModule,
    PassportModule,
  ],
})
export class ReviewsCommonModule {}
