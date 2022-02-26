import { Entity, Column, TableInheritance, Generated } from 'typeorm';
import { BaseModel } from '../common/base.model';

export enum UserRole {
  OWNER = 'OWNER',
  DRIVER = 'DRIVER',
  CONTRACTOR = 'CONTRACTOR',
  ADMIN = 'ADMIN',
  DISPATCHER = 'DISPATCHER',
  FOREMAN = 'FOREMAN',
}
@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class UserLog extends BaseModel {
  @Column()
  name: string;

  @Column({ unique: false, nullable: true })
  email: string;

  @Column('boolean', { default: false })
  verifiedEmail? = false;

  @Column()
  password: string;

  @Column({ precision: 0, type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @Column({
    default:
      'https://www.nicepng.com/png/detail/73-730154_open-default-profile-picture-png.png',
  })
  profileImg?: string;

  @Column({ unique: false, nullable: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: UserRole })
  role?: UserRole;

  @Column({ unique: true, nullable: true })
  shortid?: number;
}
