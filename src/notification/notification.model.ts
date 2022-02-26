import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { User } from '../user/user.model';

@Entity()
export class Notification extends BaseModel {
  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  link: string;

  @Column()
  submitted: Date;

  @Column()
  isChecked: boolean;

  @Column()
  priority: number;

  @ManyToOne(
    type => User,
    user => user.notifications,
    { eager: true, onDelete: 'CASCADE' },
  )
  @JoinColumn()
  user: User;
}
