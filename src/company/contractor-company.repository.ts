import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../common/base.repository';
import { TypeOrmException } from '../common/exceptions/type-orm.exception';
import { ContractorCompany } from './contractor-company.model';
import { OwnerCompany } from './owner-company.model';

@Injectable()
export class ContractorCompanyRepo extends BaseRepository<ContractorCompany>(
  ContractorCompany,
) {
  constructor(
    @InjectRepository(ContractorCompany)
    private readonly companyRepo: Repository<ContractorCompany>,
  ) {
    super(companyRepo);
  }

  createCompany(company: ContractorCompany): ContractorCompany {
    try {
      return this.companyRepo.create(company);
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async findContractorCompany(
    contractorId: string,
  ): Promise<ContractorCompany> {
    try {
      return await this.findOne({ contractor: contractorId as any });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async getCompany(companyId: string): Promise<ContractorCompany> {
    try {
      return await this.findById(companyId);
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async updateCompany(
    company: ContractorCompany,
    update,
  ): Promise<ContractorCompany> {
    try {
      return this.save({ ...company, ...update });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }
}
