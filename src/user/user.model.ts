import {
  Entity,
  Column,
  TableInheritance,
  Generated,
  OneToMany,
} from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Notification } from '../notification/notification.model';

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
export class User extends BaseModel {
  @Column()
  name: string;

  @Column({ unique: false, nullable: true })
  email: string;

  @Column('boolean', { default: false })
  verifiedEmail? = false;

  @Column()
  password: string;

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
  @Generated('increment')
  shortid?: number;

  @Column({ nullable: true })
  loggedToken?: string;

  @Column('boolean', { default: false })
  isDisable? = false;

  @Column('boolean', { default: false })
  isRestricted? = false;

  @Column({ type: 'timestamptz', nullable: true })
  restrictedAt?: Date;

  @Column({ nullable: true })
  loggedDevice?: string;

  @OneToMany(
    () => Notification,
    notification => notification.user,
    { nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  )
  notifications?: Notification[];

  @Column({ nullable: true })
  associatedUserId?: string;
}
