/* eslint-disable @typescript-eslint/camelcase */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectEventEmitter } from 'nest-emitter';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import stripeConfig from '../config/stripe.config';
import { InvoicesEventEmitter } from '../invoices/invoices.events';

@Injectable()
export class StripeEventsService {
  // TODO https://stripe.com/docs/ach#ach-specific-webhook-notifications
  private readonly STRIPE_EVENT_HANDLERS = {
    'payment_intent.succeeded': data => this.handlePaymentIntentSucceeded(data),
    'transfer.created': data => this.handleTransferPaid(data),
    'charge.succeeded': data => this.handleChargeSucceeded(data),
    'charge.pending': data => this.handleChargePending(data),
    'invoice.paid': data => this.handleInvoicePaid(data),
  };

  public constructor(
    @InjectEventEmitter()
    private readonly invoicesEventEmitter: InvoicesEventEmitter,
    @InjectStripe()
    private readonly stripeClient: Stripe,
    @Inject(stripeConfig.KEY)
    private readonly stripeConf: ConfigType<typeof stripeConfig>,
  ) {}

  async handleEvent(eventData: any, signature: string): Promise<void> {
    console.log('PARAMS', {
      eventData,
      signature,
      signingKey: this.stripeConf.signingSecret,
    });

    const event = await this.stripeClient.webhooks.constructEvent(
      eventData,
      signature,
      this.stripeConf.signingSecret,
    );

    console.log('EVENT HERE', event);

    this.STRIPE_EVENT_HANDLERS[event.type](event.data.object);
  }

  private async handlePaymentIntentSucceeded(intent: any): Promise<void> {
    this.invoicesEventEmitter.emit('intentPaid', intent.id);
  }

  private async handleChargeSucceeded(charge: any): Promise<void> {
    this.invoicesEventEmitter.emit('chargePaid', charge.id);
  }

  private async handleChargePending(charge: any): Promise<void> {
    this.invoicesEventEmitter.emit('chargePending', charge.id);
  }

  private async handleTransferPaid(transfer: any): Promise<void> {
    this.invoicesEventEmitter.emit('transferPaid', transfer.id);
  }

  private async handleInvoicePaid(invoice: any): Promise<void> {
    console.log('INVOICE PAID ID HERE', invoice.id);
    this.invoicesEventEmitter.emit('invoicePaid', invoice.id);
  }
}
