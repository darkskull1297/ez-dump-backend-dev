import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../common/base.repository';
import { Foreman } from './foreman.model';

@Injectable()
export class ForemanRepo extends BaseRepository<Foreman>(Foreman) {
  constructor(
    @InjectRepository(Foreman)
    private readonly foremanRepo: Repository<Foreman>,
  ) {
    super(foremanRepo);
  }
}
