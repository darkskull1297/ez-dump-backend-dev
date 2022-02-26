import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Bill } from '../bill/bill.model';
import { BaseModel } from '../common/base.model';
import { Location } from '../location/location.model';
import { Contractor } from '../user/contractor.model';
import { User } from '../user/user.model';

@Entity()
export class Customer extends BaseModel {
  @Column()
  name: string;

  @ManyToOne(
    () => Contractor,
    contractor => contractor.customers,
    { eager: true },
  )
  @JoinColumn()
  contractor: Contractor;

  @Column(() => Location)
  address?: Location;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @OneToMany(
    () => Bill,
    bill => bill,
  )
  bill?: Bill;
}
