import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContractorCompany } from './contractor-company.model';
import { ContractorCompanyRepo } from './contractor-company.repository';
import { OwnerCompany } from './owner-company.model';
import { OwnerCompanyRepo } from './owner-company.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OwnerCompany, ContractorCompany])],
  providers: [OwnerCompanyRepo, ContractorCompanyRepo],
  exports: [OwnerCompanyRepo, ContractorCompanyRepo, TypeOrmModule],
})
export class CompanyModule {}
