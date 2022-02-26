import { forwardRef, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { StripeModule as Stripe } from 'nestjs-stripe';

import stripeConfig from '../config/stripe.config';
import { StripePaymentsService } from './stripe-payments.service';
import { StripeController } from './controllers/stripe.controller';
import { StripeEventsService } from './stripe-events.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { StripeAccountsService } from './stripe-accounts.service';
import { StripeBankAccountService } from './stripe-bank-account.service';
import { StripeInvoicingService } from './stripe-invoing.service';

@Module({
  controllers: [StripeController],
  imports: [
    Stripe.forRootAsync({
      useFactory: (stripeConf: ConfigType<typeof stripeConfig>) => ({
        apiKey: stripeConf.secretKey,
        apiVersion: '2020-08-27',
      }),
      inject: [stripeConfig.KEY],
    }),
    forwardRef(() => InvoicesModule),
  ],
  providers: [
    StripePaymentsService,
    StripeEventsService,
    StripeAccountsService,
    StripeBankAccountService,
    StripeInvoicingService,
  ],
  exports: [
    StripePaymentsService,
    StripeEventsService,
    StripeAccountsService,
    StripeBankAccountService,
    StripeInvoicingService,
  ],
})
export class StripeModule {}
