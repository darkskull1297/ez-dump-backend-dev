import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { User } from '../user/user.model';

@Entity()
export class Review extends BaseModel {
  @Column({ type: 'real' })
  stars: number;

  @Column('text')
  comment: string;

  @ManyToOne(type => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
