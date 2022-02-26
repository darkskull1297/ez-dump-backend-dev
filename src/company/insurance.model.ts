import { Column } from 'typeorm';

export class Insurance {
  @Column()
  insuranceNumber: string;

  @Column()
  expirationDate: string;

  @Column()
  certificate: string;
}
