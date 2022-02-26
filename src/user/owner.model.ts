import { ChildEntity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User, UserRole } from './user.model';
import { OwnerCompany } from '../company/owner-company.model';
import { OwnerPriority } from './owner-priority';
import { OwnerJobInvoice } from '../invoices/owner-job-invoice.model';

@ChildEntity(UserRole.OWNER)
export class Owner extends User {
  role? = UserRole.OWNER;

  @OneToOne(
    type => OwnerCompany,
    company => company.owner,
    { nullable: true, lazy: true, cascade: true },
  )
  @JoinColumn()
  company?: Promise<OwnerCompany>;

  @Column('boolean', { default: false })
  verifiedByAdmin? = false;

  @Column({ nullable: true })
  stripeAccountId?: string;

  @Column('boolean', { default: false })
  completedStripeAccount? = false;

  @Column({ nullable: true })
  deviceID?: string;

  @Column({
    type: 'enum',
    enum: OwnerPriority,
  })
  priority? = OwnerPriority.HIGH;

  @Column('boolean', { default: false })
  hasDiscount?: boolean;

  @OneToMany(
    () => OwnerJobInvoice,
    ownInvoice => ownInvoice.owner,
  )
  ownerJobInvoice?: OwnerJobInvoice;
}
