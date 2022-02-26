import { Column } from 'typeorm';
import { Location } from '../location/location.model';

export class Company {
  @Column()
  name: string;

  @Column()
  logo: string;

  @Column()
  entityType: string;

  @Column()
  EINNumber: string;

  @Column(type => Location)
  address: Location;

  @Column()
  fax: string;

  @Column()
  officePhoneNumber: string;
}
