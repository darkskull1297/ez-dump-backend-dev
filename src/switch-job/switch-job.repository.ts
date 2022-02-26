import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../common/base.repository';
// import { User } from '../user/user.model';

import { SwitchJob } from './switch-job.model';

@Injectable()
export class SwitchJobRepo extends BaseRepository<SwitchJob>(SwitchJob) {
  constructor(
    @InjectRepository(SwitchJob)
    private readonly switchJobRepo: Repository<SwitchJob>,
  ) {
    super(switchJobRepo);
  }

  async saveSwitch(switchJob: SwitchJob): Promise<SwitchJob> {
    const savedNofitication = await this.switchJobRepo.save(switchJob);

    return savedNofitication;
  }
}
