import { Column } from 'typeorm';

export class Location {
  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'double precision', nullable: true })
  lat: string;

  @Column({ type: 'double precision', nullable: true })
  long: string;
}
