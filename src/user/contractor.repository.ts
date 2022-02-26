import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../common/base.repository';
import { Contractor } from './contractor.model';
import { ContractorCompanyRepo } from '../company/contractor-company.repository';

@Injectable()
export class ContractorRepo extends BaseRepository<Contractor>(Contractor) {
  constructor(
    @InjectRepository(Contractor)
    private readonly contractorRepo: Repository<Contractor>,
    private readonly contractorCompanyRepo: ContractorCompanyRepo,
  ) {
    super(contractorRepo);
  }

  async create({
    name,
    email,
    phoneNumber,
    password,
    company,
  }: Partial<Contractor>): Promise<Contractor> {
    const contractor = this.contractorRepo.create({
      name,
      email,
      phoneNumber,
      password,
    });
    await this.contractorRepo.save(contractor);

    await this.contractorCompanyRepo.create({
      ...company,
      contractor: Promise.resolve(contractor),
    });

    return contractor;
  }

  async getAllWithAssociatedOwner(): Promise<Contractor[]> {
    return this.contractorRepo
      .createQueryBuilder('contractor')
      .leftJoinAndSelect('contractor.company', 'company')
      .where('contractor.associatedUserId IS NOT NULL')
      .getMany();
  }

  async getContractorWithCompany(contractorId: string): Promise<Contractor> {
    return this.contractorRepo.query(`select
              us."id",
              us."name", 
              us."email",
              us."phoneNumber",
              us."profileImg",
              us."verifiedByAdmin",
              us."loggedToken",
              us."loggedDevice",
              company."companyCommonName"
                from 
                public.user us,
              public.contractor_company company
                where us."id" = '${contractorId}' and company."contractorId" = us."id" and us."role" = 'CONTRACTOR'`);
  }

  async getContractorCompanyName(contractorId: string): Promise<Contractor> {
    return this.contractorRepo.query(`select
              company."companyCommonName"
                from 
                public.user us,
              public.contractor_company company
                where us."id" = '${contractorId}' and company."contractorId" = us."id" and us."role" = 'CONTRACTOR'`);
  }
}
