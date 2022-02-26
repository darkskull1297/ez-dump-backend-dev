import { ManyToOne, OneToMany, ChildEntity, Column } from 'typeorm';
import { OwnerCompany } from '../company/owner-company.model';
import { JobAssignation } from '../jobs/job-assignation.model';
import { DriverStatus } from './driver-status';
import { DriverPaymentMethods } from './driverPaymentMethods';
import { User, UserRole } from './user.model';

@ChildEntity(UserRole.DRIVER)
export class Driver extends User {
  role? = UserRole.DRIVER;
  verifiedEmail? = true;

  @ManyToOne(
    type => OwnerCompany,
    company => company.drivers,
    { eager: true, onDelete: 'CASCADE' },
  )
  drivingFor?: OwnerCompany;

  @OneToMany(
    type => JobAssignation,
    assignation => assignation.driver,
  )
  assignations?: JobAssignation[];

  @Column('boolean', { default: true })
  isActive? = true;

  @Column()
  dateOfBirth: string;

  @Column()
  licenseExpiredDate: string;

  @Column()
  licenseNumber: string;

  @Column()
  medicalCard?: string;

  @Column({ nullable: true })
  LicenseBack?: string;

  @Column({ nullable: true })
  LicenseFront?: string;

  @Column({ type: 'real' })
  pricePerHour: number;

  @Column({ type: 'enum', enum: DriverStatus })
  status?: DriverStatus;

  @Column({ type: 'enum', enum: DriverPaymentMethods })
  paymentMethod: DriverPaymentMethods;

  @Column({ type: 'enum', enum: DriverPaymentMethods })
  paymentSubMethod: DriverPaymentMethods;

  @Column({ type: 'real' })
  percent: number;

  @Column({ nullable: true })
  deviceID?: string;
}
