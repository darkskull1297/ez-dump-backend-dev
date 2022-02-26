import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { TruckCategoryRequestTruck } from './truck-category-request-truck.model';

@Injectable()
export class TruckCategoryRequestTruckRepo extends BaseRepository<
TruckCategoryRequestTruck
>(TruckCategoryRequestTruck) {
  constructor(
    @InjectRepository(TruckCategoryRequestTruck)
    private readonly truckCategoryRequestTruckRepo: Repository<
    TruckCategoryRequestTruck
    >,
  ) {
    super(truckCategoryRequestTruckRepo);
  }
}
