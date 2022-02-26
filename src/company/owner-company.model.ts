import { OneToOne, OneToMany, JoinColumn, Column, Entity } from 'typeorm';
import { Truck } from '../trucks/truck.model';
import { Driver } from '../user/driver.model';
import { Owner } from '../user/owner.model';
import { Company } from './company.model';
import { Insurance } from './insurance.model';
import { CustomInsurance } from './custom-insurance.model';
import { OwnerContact } from './owner-contact.model';
import { BaseModel } from '../common/base.model';
import { Location } from '../location/location.model';
import { User } from '../user/user.model';

@Entity()
export class OwnerCompany extends BaseModel {
  @Column(type => Company)
  companyCommon: Company;

  @Column({ type: 'real' })
  jobRadius: number;

  @Column()
  formW9: string;

  @Column()
  DOTNumber: string;

  @Column(type => Location)
  parkingLotAddress?: Location;

  @Column()
  bankNameAndAddress: string;

  @Column()
  routingNumber: string;

  @Column()
  accountNumber: string;

  @Column(type => Insurance)
  generalLiabilityInsurance: Insurance;

  @Column(type => Insurance)
  autoLiabilityInsurance: Insurance;

  @Column(type => Insurance)
  workersCompensationsInsurance: Insurance;

  @OneToMany(
    type => CustomInsurance,
    insurance => insurance.company,
    { eager: true, cascade: true },
  )
  customInsuranceList: CustomInsurance[];

  @OneToOne(
    type => Owner,
    user => user.company,
    { lazy: true },
  )
  @JoinColumn()
  owner?: Promise<Owner>;

  @OneToMany(
    type => Driver,
    user => user.drivingFor,
  )
  drivers?: Promise<Driver[]>;

  @OneToMany(
    type => Truck,
    truck => truck.company,
  )
  trucks?: Promise<Truck[]>;

  @OneToMany(
    type => OwnerContact,
    contact => contact.company,
    { eager: true, cascade: true },
  )
  contacts?: OwnerContact[];
}
