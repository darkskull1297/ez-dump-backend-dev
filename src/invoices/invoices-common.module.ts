import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { JobInvoice } from './job-invoice.model';
import { DriverWeeklyInvoice } from './driver-weekly-invoice.model';
import { InvoicesEventsService } from './invoices-events.service';
import { JobInvoiceService } from './job-invoice.service';
import { JobInvoiceRepo } from './job-invoice.repository';
import { JobInvoiceCalculator } from './job-invoice.calculator';
import { JobsModule } from '../jobs/jobs.module';
import { TimerModule } from '../timer/timer.module';
import { DriverJobInvoiceService } from './driver-job-invoice.service';
import { UserModule } from '../user/user.module';
import { InvoicingTasksService } from './invoicing-tasks.service';
import { DriverWeeklyInvoiceRepo } from './driver-weekly-invoice.repository';
import { OwnerJobInvoice } from './owner-job-invoice.model';
import { LateFeeInvoiceRepo } from './late-fee-invoice.repository';
import { LateFeeInvoice } from './late-fee-invoice.model';
import { LateFeeInvoiceService } from './late-fee-invoice.service';
import { StripeModule } from '../stripe/stripe.module';
import { EmailModule } from '../email/email.module';
import { DisputeInvoiceService } from './dispute-invoice.service';
import { DisputeInvoiceRepo } from './dispute-invoice.repository';
import { DriverJobInvoiceRepo } from './driver-job-invoice.repository';
import { DriverJobInvoice } from './driver-job-invoice.model';
import { DisputeInvoice } from './dispute-invoice.model';
import { OwnerJobInvoiceRepo } from './owner-job-invoice.repository';
import { OwnerJobInvoiceService } from './owner-job-invoice.service';
import { NotificationModule } from '../notification/notification.module';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { GeolocationService } from '../geolocation/geolocation.service';
import { LocationModule } from '../location/location.module';
import { LocationService } from '../location/location.service';
import { TrucksModule } from '../trucks/trucks.module';
import { CustomerModule } from '../customer/customer.module';
import { GeneralJobModule } from '../general-jobs/general-job.module';
import { ManualPayment } from './manual-payment.model';
import { ManualPaymentRepo } from './manual-payment.repository';
import { ManualPaymentService } from './manual-payment.service';
import { JobAssignation } from '../jobs/job-assignation.model';
import { JobAssignationRepo } from '../jobs/job-assignation.repository';
import { Loads } from '../geolocation/loads.model';
import { LoadsRepo } from '../geolocation/loads.repository';
import { LateFeeManualPaymentRepo } from './late-fee-manual-payment.repository';
import { LateFeeManualPayment } from './late-fee-manual-payment.model';
import { LateFeeManualPaymentService } from './late-fee-manual-payment.service';
import { S3Module } from '../s3/s3.module';
import {DisputeLoads} from './dispute-loads.model';
import {DisputeLoadsRepo} from './dispute-loads.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loads,
      LateFeeManualPayment,
      JobInvoice,
      JobAssignation,
      DriverWeeklyInvoice,
      OwnerJobInvoice,
      LateFeeInvoice,
      DriverJobInvoice,
      DisputeInvoice,
      ManualPayment,
      DisputeLoads
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JobsModule,
    forwardRef(() => UserModule),
    forwardRef(() => StripeModule),
    forwardRef(() => TimerModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => TrucksModule),
    forwardRef(() => CustomerModule),
    forwardRef(() => GeneralJobModule),
    EmailModule.forChild(),
    GeolocationModule,
    LocationModule,
    S3Module,
  ],
  providers: [
    LateFeeManualPaymentRepo,
    LateFeeInvoiceRepo,
    LateFeeInvoiceService,
    InvoicesEventsService,
    DriverJobInvoiceService,
    JobInvoiceService,
    DriverWeeklyInvoiceRepo,
    JobInvoiceRepo,
    JobInvoiceCalculator,
    InvoicingTasksService,
    DisputeInvoiceService,
    DriverJobInvoiceRepo,
    DisputeInvoiceRepo,
    OwnerJobInvoiceRepo,
    OwnerJobInvoiceService,
    GeolocationService,
    LocationService,
    ManualPaymentRepo,
    ManualPaymentService,
    LateFeeManualPaymentService,
    JobAssignationRepo,
    LoadsRepo,
    DisputeLoadsRepo
  ],
  exports: [
    LateFeeManualPaymentRepo,
    LateFeeInvoiceRepo,
    LateFeeInvoiceService,
    InvoicesEventsService,
    DriverWeeklyInvoiceRepo,
    DriverJobInvoiceService,
    JobInvoiceService,
    JobInvoiceRepo,
    JobInvoiceCalculator,
    PassportModule,
    TypeOrmModule,
    InvoicingTasksService,
    DisputeInvoiceService,
    DriverJobInvoiceRepo,
    DisputeInvoiceRepo,
    ManualPaymentRepo,
    OwnerJobInvoiceRepo,
    OwnerJobInvoiceService,
    EmailModule,
    ManualPaymentService,
    LateFeeManualPaymentService,
    JobAssignationRepo,
    LoadsRepo,
  ],
})
export class InvoicesCommonModule {}
