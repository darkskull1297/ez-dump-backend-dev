import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { TruckLog } from './truck-log.model';

@Injectable()
export class TruckLogRepo extends BaseRepository<TruckLog>(TruckLog) {
  constructor(
    @InjectRepository(TruckLog)
    private readonly truckLogRepo: Repository<TruckLog>,
  ) {
    super(truckLogRepo);
  }
}
