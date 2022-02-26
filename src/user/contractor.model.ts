import {
  ChildEntity,
  Column,
  OneToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { ContractorCompany } from '../company/contractor-company.model';
import { User, UserRole } from './user.model';
import { Truck } from '../trucks/truck.model';
import { Customer } from '../customer/customer.model';

@ChildEntity(UserRole.CONTRACTOR)
export class Contractor extends User {
  role? = UserRole.CONTRACTOR;

  @Column({ nullable: true })
  stripeCustomerId?: string;

  @OneToOne(
    type => ContractorCompany,
    company => company.contractor,
    { nullable: true, eager: true, onDelete: 'CASCADE', cascade: true },
  )
  company?: ContractorCompany;

  @Column('boolean', { default: false })
  verifiedByAdmin? = false;

  @ManyToMany(
    type => Truck,
    truck => truck.favoriteContractors,
    { eager: true, nullable: true },
  )
  @JoinTable()
  favoriteTrucks?: Truck[];

  // @Column('boolean', { default: false })
  // hasDiscount?: boolean;

  @OneToMany(
    () => Customer,
    customer => customer.contractor,
    { nullable: true, eager: false, onDelete: 'CASCADE' },
  )
  customers?: Customer[];
}
