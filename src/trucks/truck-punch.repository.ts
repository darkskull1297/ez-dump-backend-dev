import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { subWeeks, startOfToday } from 'date-fns';
import { BaseRepository } from '../common/base.repository';
import { TruckPunch } from './truck-punch.model';

@Injectable()
export class TruckPunchRepo extends BaseRepository<TruckPunch>(TruckPunch) {
  constructor(
    @InjectRepository(TruckPunch)
    private readonly truckPunchRepo: Repository<TruckPunch>,
  ) {
    super(truckPunchRepo);
  }

  findThisWeekPunchs(driverId: string) {
    return this.truckPunchRepo
      .createQueryBuilder('truckPunch')
      .where('truckPunch.driverId = :driverId', { driverId })
      .andWhere('truckPunch.punchOut > :weekAgo', {
        weekAgo: subWeeks(new Date(), 1).toISOString(),
      })
      .andWhere('truckPunch.punchOut < :day', {
        day: startOfToday().toISOString(),
      })
      .getMany();
  }

  findLastDriverPunch(driverId: string) {
    return this.truckPunchRepo
      .createQueryBuilder('truckPunch')
      .where('truckPunch.driverId = :driverId', { driverId })
      .andWhere('truckPunch.punchOut is NULL')
      .getOne();
  }
}
