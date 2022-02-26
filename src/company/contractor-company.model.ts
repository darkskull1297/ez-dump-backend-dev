import { OneToOne, JoinColumn, Column, Entity, OneToMany } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Contractor } from '../user/contractor.model';
import { Dispatcher } from '../user/dispatcher.model';
import { Foreman } from '../user/foreman.model';
import { Company } from './company.model';
import { ContractorContact } from './contractor-contact.model';

@Entity()
export class ContractorCompany extends BaseModel {
  @Column(() => Company)
  companyCommon: Company;

  @OneToOne(
    () => Contractor,
    user => user.company,
    { lazy: true },
  )
  @JoinColumn()
  contractor?: Promise<Contractor>;

  @Column('text', { array: true })
  insuranceNeeded: string[];

  @Column('text', { array: true })
  cities: string[];

  @OneToMany(
    () => ContractorContact,
    contact => contact.company,
    { eager: true, cascade: true },
  )
  contacts?: ContractorContact[];

  @OneToMany(
    () => Dispatcher,
    user => user.contractorCompany,
  )
  dispatchers?: Promise<Dispatcher[]>;

  @OneToMany(
    () => Dispatcher,
    user => user.contractorCompany,
  )
  foremans?: Promise<Foreman[]>;
}
