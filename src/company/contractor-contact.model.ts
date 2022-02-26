import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Contact } from './contact.model';
import { ContractorCompany } from './contractor-company.model';

@Entity()
export class ContractorContact extends Contact {
  @ManyToOne(type => ContractorCompany, { onDelete: 'CASCADE' })
  @JoinColumn()
  company: ContractorCompany;
}
