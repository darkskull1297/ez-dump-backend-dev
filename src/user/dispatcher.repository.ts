import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../common/base.repository';
import { Dispatcher } from './dispatcher.model';

@Injectable()
export class DispatcherRepo extends BaseRepository<Dispatcher>(Dispatcher) {
  constructor(
    @InjectRepository(Dispatcher)
    private readonly dispatcherRepo: Repository<Dispatcher>,
  ) {
    super(dispatcherRepo);
  }
}
