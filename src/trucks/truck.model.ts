import { Entity, Column, ManyToOne, OneToMany, ManyToMany } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { TruckType } from './truck-type';
import { TruckSubType } from './truck-subtype';
import { JobAssignation } from '../jobs/job-assignation.model';
import { OwnerCompany } from '../company/owner-company.model';
import { TruckStatus } from './truck-status';
import { ReviewTruck } from '../reviews/review-truck.model';
import { Contractor } from '../user/contractor.model';
import { TruckCategory } from './truck-category.model';
import { Loads } from '../geolocation/loads.model';

@Entity()
export class Truck extends BaseModel {
  @Column('text')
  number: string;

  @Column('boolean', { default: false })
  isDisable? = false;

  @Column('boolean', { default: true })
  isActive = true;

  @ManyToOne(
    () => OwnerCompany,
    company => company.trucks,
    { onDelete: 'CASCADE', eager: true },
  )
  company: OwnerCompany;

  @Column({
    type: 'enum',
    enum: TruckType,
  })
  type: TruckType;

  @Column({
    type: 'enum',
    enum: TruckSubType,
    array: true,
    nullable: true,
  })
  subtype: TruckSubType[];

  @Column({ type: 'real' })
  grossTons: number;

  @Column({ type: 'real' })
  tareWeight: number;

  @Column({ type: 'real' })
  netTons: number;

  @Column()
  VINNumber: string;

  @Column()
  plateNumber: string;

  @Column()
  truckMakeAndModel: string;

  @Column()
  truckYear: string;

  @OneToMany(
    () => JobAssignation,
    assignation => assignation.truck,
  )
  assignations?: JobAssignation[];

  @OneToMany(
    () => TruckCategory,
    truckCategory => truckCategory.preferredTruck,
    // { eager: true },
  )
  // @JoinColumn()
  truckCategories?: TruckCategory[];

  @OneToMany(
    () => Loads,
    load => load.truck,
  )
  loads?: Loads[];

  @ManyToMany(
    () => Contractor,
    contractor => contractor.favoriteTrucks,
    { nullable: true },
  )
  favoriteContractors?: Contractor[];

  status?: TruckStatus;

  @OneToMany(
    () => ReviewTruck,
    reviewTruck => reviewTruck.truck,
    { eager: true, nullable: true },
  )
  // @JoinColumn()
  reviews?: ReviewTruck[];

  @Column('real', { nullable: true, default: 0 })
  miles?: number;

  @Column({ nullable: true })
  registrationCard?: string;
}
