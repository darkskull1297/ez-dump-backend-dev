import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { Problem } from './problem.model';

@Injectable()
export class ProblemRepo extends BaseRepository<Problem>(Problem) {
  constructor(
    @InjectRepository(Problem)
    private readonly problemRepo: Repository<Problem>,
  ) {
    super(problemRepo);
  }
}
