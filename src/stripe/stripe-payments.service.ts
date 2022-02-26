/* eslint-disable @typescript-eslint/camelcase */
import { Injectable } from '@nestjs/common';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { Contractor } from '../user/contractor.model';

@Injectable()
export class StripePaymentsService {
  private readonly STRIPE_CURRENCY = 'usd';
  private readonly STRIPE_CURRENCY_CONVERSION = 100;
  private readonly STRIPE_USAGE_FEES = 0.03;

  public constructor(@InjectStripe() private readonly stripeClient: Stripe) {}

  async createPaymentIntent(
    amount: number,
    invoiceId: string,
    contractor: Contractor,
    customerId?: string,
  ): Promise<{ clientSecret: string; customerId: string; intentId: string }> {
    try {
      if (!customerId) {
        const customer = await this.stripeClient.customers.create({
          email: contractor.email,
          name: contractor.name,
          phone: contractor.phoneNumber,
        });
        customerId = customer.id;
      }

      const payment_method = await this.getCardId(customerId);

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: this.calculateStripeAmount(amount),
        currency: this.STRIPE_CURRENCY,
        customer: customerId,
        setup_future_usage: 'off_session',
      };

      if (payment_method) paymentIntentParams.payment_method = payment_method;

      const intent = await this.stripeClient.paymentIntents.create(
        paymentIntentParams,
        { idempotencyKey: invoiceId },
      );

      return {
        customerId,
        clientSecret: intent.client_secret,
        intentId: intent.id,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async updateIntentAmount(
    newAmount: number,
    invoiceId: string,
    intentId: string,
  ): Promise<void> {
    await this.stripeClient.paymentIntents.update(intentId, {
      amount: this.calculateStripeAmount(newAmount),
    });
  }

  async createTransfer(
    amount: number,
    destinationAccount: string,
  ): Promise<string> {
    const transfer = await this.stripeClient.transfers.create({
      amount: this.calculateStripeAmountForOwner(amount),
      currency: this.STRIPE_CURRENCY,
      destination: destinationAccount,
    });
    return transfer.id;
  }

  async getIntentsClientSecret(intentId: string): Promise<string> {
    const intent = await this.stripeClient.paymentIntents.retrieve(intentId);
    return intent.client_secret;
  }

  async getCardId(customerId: string): Promise<string> {
    const paymentMethods = await this.stripeClient.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    if (!paymentMethods.data.length) return null;

    const [paymentMethod] = paymentMethods.data;
    return paymentMethod.id;
  }

  private calculateStripeAmount(amount: number): number {
    const newAmount =
      amount * this.STRIPE_CURRENCY_CONVERSION * (1 + this.STRIPE_USAGE_FEES);
    const rounded = Math.round(newAmount);
    return rounded;
  }

  private calculateStripeAmountForOwner(amount: number): number {
    const newAmount = amount * this.STRIPE_CURRENCY_CONVERSION;
    const rounded = Math.round(newAmount);
    return rounded;
  }

  async createCharge(
    amount: number,
    customerId: string,
    invoiceId: string,
    sourceId?: string,
  ): Promise<Stripe.Charge> {
    return this.stripeClient.charges.create(
      {
        amount: this.calculateStripeAmount(amount),
        currency: 'usd',
        customer: customerId,
      },
      {
        idempotencyKey: invoiceId,
      },
    );
  }
}
