import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../common/base.repository';
import { Admin } from './admin.model';

@Injectable()
export class AdminRepo extends BaseRepository<Admin>(Admin) {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {
    super(adminRepo);
  }
}
