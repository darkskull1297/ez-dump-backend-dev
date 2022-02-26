import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { OwnerCompany } from './owner-company.model';

@Entity()
export class CustomInsurance extends BaseModel {
  @Column()
  insuranceName: string;

  @Column()
  insuranceNumber: string;

  @Column()
  expirationDate: string;

  @Column()
  certificate: string;

  @ManyToOne(
    type => OwnerCompany,
    company => company.customInsuranceList,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  company: OwnerCompany;
}
