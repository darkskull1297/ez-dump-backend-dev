import { Entity, Column, Unique } from 'typeorm';
import { BaseModel } from '../common/base.model';

@Unique(['name'])
@Entity()
export class Materials extends BaseModel {
  @Column('text')
  name: string;
}
