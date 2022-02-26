import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { TruckCategory } from './truck-category.model';

@Injectable()
export class TruckCategoryRepo extends BaseRepository<TruckCategory>(
  TruckCategory,
) {
  constructor(
    @InjectRepository(TruckCategory)
    private readonly truckCategoryRepo: Repository<TruckCategory>,
  ) {
    super(truckCategoryRepo);
  }

  findWithJob(id: string): Promise<TruckCategory> {
    return this.truckCategoryRepo
      .createQueryBuilder('truckCategory')
      .leftJoinAndSelect('truckCategory.preferredTruck', 'preferredTruck')
      .leftJoinAndSelect('truckCategory.job', 'job')
      .leftJoinAndSelect('job.user', 'user')
      .where('truckCategory.id = :id', { id })
      .getOne();
  }
}
