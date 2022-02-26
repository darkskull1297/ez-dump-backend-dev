import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { ReviewTruck } from './review-truck.model';
import { Truck } from '../trucks/truck.model';

@Injectable()
export class ReviewTruckRepo extends BaseRepository<ReviewTruck>(ReviewTruck) {
  constructor(
    @InjectRepository(ReviewTruck)
    private readonly reviewTruckRepo: Repository<ReviewTruck>,
  ) {
    super(reviewTruckRepo);
  }

  async truckForJobIsAlreadyReviewed(
    scheduledJobId: string,
    truckId: string,
  ): Promise<boolean> {
    const truckMatching = await this.reviewTruckRepo
      .createQueryBuilder('review')
      .leftJoin('review.scheduledJob', 'scheduledJob')
      .leftJoin('review.truck', 'truck')
      .where('truck.id = :id', { id: truckId })
      .andWhere('scheduledJob.id = :scheduledId', {
        scheduledId: scheduledJobId,
      })
      .getCount();
    return truckMatching > 0;
  }

  async findTruckReviews(truck: Truck): Promise<ReviewTruck[]> {
    return this.reviewTruckRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect('review.truck', 'truck')
      .where('truck.id = :id', { id: truck.id })
      .getMany();
  }
}
