import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Job } from '../jobs/job.model';
import { User } from '../user/user.model';
import { Truck } from '../trucks/truck.model';
import { GeolocationType } from './geolocation-type';

@Entity()
export class Geolocation extends BaseModel {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  driver: User;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn()
  job: Job;

  @ManyToOne(() => Truck, { onDelete: 'CASCADE' })
  @JoinColumn()
  truck: Truck;

  @Column({ type: 'double precision' })
  lat: string;

  @Column({ type: 'double precision' })
  long: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ nullable: true })
  registerBy?: string;

  @Column({ nullable: true, type: 'real' })
  speed?: number;

  @Column({
    type: 'enum',
    nullable: true,
    enum: GeolocationType,
  })
  type? = GeolocationType.IN_ROAD;

  @Column({
    type: 'real',
    nullable: true,
  })
  stationaryMinutes?: number;
}
