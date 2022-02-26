import { Entity, Column, ManyToOne } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { DriverWeeklyInvoice } from '../invoices/driver-weekly-invoice.model';
import { Location } from '../location/location.model';

@Entity()
export class TruckPunch extends BaseModel {
  @Column(type => Location)
  punchInAddress: Location;

  @Column(type => Location)
  punchOutAddress?: Location;

  @Column()
  punchIn: string;

  @Column({ nullable: true })
  punchOut: string;

  @Column()
  driverId: string;

  @ManyToOne(
    type => DriverWeeklyInvoice,
    driverWeeklyInvoice => driverWeeklyInvoice.truckPunchs,
    { nullable: true },
  )
  driverWeeklyInvoice: DriverWeeklyInvoice;
}
