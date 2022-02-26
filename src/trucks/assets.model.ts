import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseModel } from '../common/base.model';
import { TruckInspection } from './truck-inspection.model';

@Entity()
export class Assets extends BaseModel {
  @PrimaryGeneratedColumn('increment')
  assetNumber?: number;

  @Column({ nullable: true })
  fixedAt?: Date;

  @Column()
  status: string;

  @Column()
  title: string;

  @ManyToOne(() => TruckInspection)
  @JoinColumn()
  truckInspection: TruckInspection;

  @Column()
  cardTitle: string;

  @Column('integer')
  cardId: number;

  @Column('integer')
  assetId: number;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column('text', { nullable: true, array: true, default: {} })
  image?: string[];

  @Column({ nullable: true })
  value?: string;
}
