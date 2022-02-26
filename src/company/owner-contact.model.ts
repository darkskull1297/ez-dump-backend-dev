import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Contact } from './contact.model';
import { OwnerCompany } from './owner-company.model';

@Entity()
export class OwnerContact extends Contact {
  @ManyToOne(type => OwnerCompany, { onDelete: 'CASCADE' })
  @JoinColumn()
  company: OwnerCompany;
}
