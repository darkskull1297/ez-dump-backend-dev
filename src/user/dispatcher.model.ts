import { ManyToOne, ManyToMany, ChildEntity, JoinTable } from 'typeorm';
import { ContractorCompany } from '../company/contractor-company.model';
import { Truck } from '../trucks/truck.model';
import { User, UserRole } from './user.model';

@ChildEntity(UserRole.DISPATCHER)
export class Dispatcher extends User {
  role? = UserRole.DISPATCHER;
  verifiedEmail? = true;

  @ManyToOne(
    type => ContractorCompany,
    company => company.dispatchers,
    { eager: true, onDelete: 'CASCADE' },
  )
  contractorCompany?: ContractorCompany;
}
