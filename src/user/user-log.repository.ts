import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { UserLog } from './user-log.model';

@Injectable()
export class UserLogRepo extends BaseRepository<UserLog>(UserLog) {
  constructor(
    @InjectRepository(UserLog)
    private readonly userLogRepo: Repository<UserLog>,
  ) {
    super(userLogRepo);
  }
}
