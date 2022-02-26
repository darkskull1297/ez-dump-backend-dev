import { Entity, Column } from 'typeorm';

import { BaseModel } from '../common/base.model';

@Entity()
export class Settings extends BaseModel {
  @Column('text')
  setting: string;

  @Column('text')
  value: string;
}
