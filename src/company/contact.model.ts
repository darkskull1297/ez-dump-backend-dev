import { Column } from 'typeorm';
import { BaseModel } from '../common/base.model';

export class Contact extends BaseModel {
  @Column()
  name: string;

  @Column()
  title: string;

  @Column()
  phoneNumber: string;

  @Column()
  email: string;
}
