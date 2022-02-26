import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnaliticsOwnerController } from './analitics.controller';
import { AnaliticsService } from './analitics.service';
import { AnaliticsOwnerRepository } from './analitics.repository';
import { Job } from '../jobs/job.model';
import { UserRepo } from '../user/user.repository';
import { OwnerRepo } from '../user/owner.repository';
import { ContractorRepo } from '../user/contractor.repository';
import { Contractor } from '../user/contractor.model';
import { User } from '../user/user.model';
import { Owner } from '../user/owner.model';
import { Admin } from '../user/admin.model';
import { AdminRepo } from '../user/admin.repository';
import { Driver } from '../user/driver.model';
import { DriverRepo } from '../user/driver.repository';
import { OwnerCompany } from '../company/owner-company.model';
import { OwnerCompanyRepo } from '../company/owner-company.repository';
import { Dispatcher } from '../user/dispatcher.model';
import { DispatcherRepo } from '../user/dispatcher.repository';
import { Foreman } from '../user/foreman.model';
import { ForemanRepo } from '../user/foreman.repository';
import { ContractorCompany } from '../company/contractor-company.model';
import { ContractorCompanyRepo } from '../company/contractor-company.repository';
import { OwnerJobInvoice } from '../invoices/owner-job-invoice.model';
import { JobInvoiceRepo } from '../invoices/job-invoice.repository';
import { JobInvoice } from '../invoices/job-invoice.model';
import { OwnerJobInvoiceRepo } from '../invoices/owner-job-invoice.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      User,
      Owner,
      Admin,
      Driver,
      Contractor,
      OwnerCompany,
      Dispatcher,
      Foreman,
      ContractorCompany,
      OwnerJobInvoice,
      JobInvoice,
      Foreman,
    ]),
  ],
  controllers: [AnaliticsOwnerController],
  providers: [
    AnaliticsService,
    AnaliticsOwnerRepository,
    UserRepo,
    OwnerRepo,
    ContractorRepo,
    AdminRepo,
    DriverRepo,
    OwnerCompanyRepo,
    ContractorCompanyRepo,
    DispatcherRepo,
    ForemanRepo,
    JobInvoiceRepo,
    OwnerJobInvoiceRepo,
    ForemanRepo,
  ],
})
export class AnaliticsModule {}
