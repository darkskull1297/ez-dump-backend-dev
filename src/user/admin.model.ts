import { ChildEntity, Column } from 'typeorm';
import { User, UserRole } from './user.model';

@ChildEntity(UserRole.ADMIN)
export class Admin extends User {
  role? = UserRole.ADMIN;
  verifiedEmail? = true;

  @Column('boolean', { default: false })
  readonly? = false;
}
