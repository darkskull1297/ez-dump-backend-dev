import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../common/base.repository';
import { TypeOrmException } from '../common/exceptions/type-orm.exception';
import { OwnerCompany } from './owner-company.model';

@Injectable()
export class OwnerCompanyRepo extends BaseRepository<OwnerCompany>(
  OwnerCompany,
) {
  constructor(
    @InjectRepository(OwnerCompany)
    private readonly companyRepo: Repository<OwnerCompany>,
  ) {
    super(companyRepo);
  }

  createCompany(company: OwnerCompany): OwnerCompany {
    try {
      return this.companyRepo.create(company);
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async getCompany(companyId: string): Promise<OwnerCompany> {
    try {
      return await this.findById(companyId);
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async updateCompany(company: OwnerCompany, update): Promise<OwnerCompany> {
    try {
      return this.save({ ...company, ...update });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async findOwnerCompany(ownerId: string): Promise<OwnerCompany> {
    try {
      return await this.findOne({ owner: ownerId as any });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }
  async findAllOwnerCompany(): Promise<OwnerCompany[]> {
    try {
      return await this.companyRepo.find();
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }
}
