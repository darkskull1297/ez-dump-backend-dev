import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { Review } from './review.model';

@Injectable()
export class ReviewsRepo extends BaseRepository<Review>(Review) {
  constructor(
    @InjectRepository(Review) private readonly reviewsRepo: Repository<Review>,
  ) {
    super(reviewsRepo);
  }
}
