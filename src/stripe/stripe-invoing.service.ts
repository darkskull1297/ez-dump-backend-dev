/* eslint-disable @typescript-eslint/camelcase */
import { Injectable } from '@nestjs/common';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { Contractor } from '../user/contractor.model';

@Injectable()
export class StripeInvoicingService {
  private readonly STRIPE_CURRENCY = 'usd';
  private readonly STRIPE_CURRENCY_CONVERSION = 100;
  private readonly STRIPE_USAGE_FEES = 0.03;

  public constructor(@InjectStripe() private readonly stripeClient: Stripe) {}

  async createInvoice(
    items: { name: string; quantity: number; amount: number }[],
    invoiceNumber: string | number,
    contractor: Contractor,
    dueDate: any,
    customerId?: string,
  ): Promise<{ stripeInvoiceId: string; customerId: string }> {
    try {
      if (!customerId) {
        const customer = await this.stripeClient.customers.create({
          email: contractor.email,
          name: contractor.name,
          phone: contractor.phoneNumber,
        });
        customerId = customer.id;
      }

      await Promise.all(
        items.map(async item => {
          await this.stripeClient.invoiceItems.create({
            customer: customerId,
            amount: this.calculateStripeAmount(item.amount),
            currency: this.STRIPE_CURRENCY,
            description: item.name,
          });
        }),
      );

      const invoice = await this.stripeClient.invoices.create({
        customer: customerId,
        description: `Invoice number: ${invoiceNumber}`,
        collection_method: 'send_invoice',
        due_date: Math.floor(new Date(dueDate).getTime() / 1000),
      });

      await this.sendInvoiceForManualPayment(invoice.id);

      return {
        customerId,
        stripeInvoiceId: invoice.id,
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async addInvoiceItems(
    item: { name: string; quantity: number; amount: number },
    invoiceId: string,
    customerId: string,
    newDueDate: Date,
  ): Promise<void> {
    await this.stripeClient.invoiceItems.create({
      customer: customerId,
      amount: item.amount,
      currency: this.STRIPE_CURRENCY,
      description: item.name,
      invoice: invoiceId,
    });

    await this.stripeClient.invoices.update(invoiceId, {
      due_date: Math.floor(new Date(newDueDate).getTime() / 1000),
    });
  }

  async payInvoiceByCard(
    cardToken: string,
    invoiceId: string,
    customerId: string,
  ): Promise<Stripe.Invoice> {
    const card = await this.stripeClient.customers.createSource(customerId, {
      source: cardToken,
    });
    const invoice = await this.stripeClient.invoices.pay(invoiceId, {
      source: card.id,
    });

    return invoice;
  }

  async sendInvoiceForManualPayment(
    invoiceId: string,
  ): Promise<Stripe.Invoice> {
    const invoice = await this.stripeClient.invoices.sendInvoice(invoiceId);

    return invoice;
  }

  async voidInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    const invoice = await this.stripeClient.invoices.voidInvoice(invoiceId);

    return invoice;
  }

  async createNewInvoiceToAddLateFee(
    invoiceId: string,
    customerId: string,
    newItem: { name: string; quantity: number; amount: number },
    invoiceNumber: string | number,
    dueDate: any,
  ): Promise<Stripe.Invoice> {
    await this.voidInvoice(invoiceId);

    let invoiceLineItems;
    let last = null;

    do {
      invoiceLineItems = await this.stripeClient.invoices.listLineItems(
        invoiceId,
        last === null
          ? {
            limit: 100,
          }
          : {
            limit: 100,
            starting_after: last.id,
          },
      );

      await Promise.all(
        invoiceLineItems.data.map(async item => {
          await this.stripeClient.invoiceItems.create({
            customer: customerId,
            amount: item.amount,
            currency: item.currency,
            description: item.description,
          });
        }),
      );

      last = invoiceLineItems.data[invoiceLineItems.data.length - 1];
    } while (invoiceLineItems.has_more);

    await this.stripeClient.invoiceItems.create({
      customer: customerId,
      amount: newItem.amount,
      currency: this.STRIPE_CURRENCY,
      description: newItem.name,
    });

    const newInvoice = await this.stripeClient.invoices.create({
      customer: customerId,
      description: `Invoice number: ${invoiceNumber}`,
      collection_method: 'send_invoice',
      due_date: Math.floor(new Date(dueDate).getTime() / 1000),
    });

    await this.sendInvoiceForManualPayment(newInvoice.id);

    return newInvoice;
  }

  async payInvoiceByBank(
    bankId: string,
    invoiceId: string,
  ): Promise<Stripe.Invoice> {
    const invoice = await this.stripeClient.invoices.pay(invoiceId, {
      source: bankId,
    });

    return invoice;
  }

  private calculateStripeAmount(amount: number): number {
    const newAmount =
      amount * this.STRIPE_CURRENCY_CONVERSION * (1 + this.STRIPE_USAGE_FEES);
    const rounded = Math.round(newAmount);
    return rounded;
  }
}
