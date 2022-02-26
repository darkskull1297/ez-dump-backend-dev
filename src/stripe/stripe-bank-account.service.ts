/* eslint-disable @typescript-eslint/camelcase */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectEventEmitter } from 'nest-emitter';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { AuthEventEmitter } from '../auth/auth.events';
import stripeConfig from '../config/stripe.config';
import { StripeBankAccountDTO } from './dto/stripe-bank-account.dto';
import { Contractor } from '../user/contractor.model';
import { VerifyCodeBankAccountException } from './exceptions/verify-code-bank-account';

@Injectable()
export class StripeBankAccountService {
  public constructor(
    @InjectEventEmitter()
    private readonly eventEmitter: AuthEventEmitter,
    @InjectStripe()
    private readonly stripeClient: Stripe,
    @Inject(stripeConfig.KEY)
    private readonly stripeConf: ConfigType<typeof stripeConfig>,
  ) {}

  async listBankAccountCustomer(
    customerId: string,
  ): Promise<Stripe.BankAccount[]> {
    const bankAccounts = await this.stripeClient.customers.listSources(
      customerId,
      { object: 'bank_account', limit: 5 },
    );
    return bankAccounts.data as Stripe.BankAccount[];
  }

  async createBankAccountToken(
    bank: StripeBankAccountDTO,
    customerId: string,
    contractor: Contractor,
  ): Promise<{ token: Stripe.Token; customerId: string }> {
    const token = await this.stripeClient.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_holder_name: bank.accountHolderName,
        account_holder_type: bank.accountHolderType as any,
        routing_number: bank.routingNumber,
        account_number: bank.accountNumber,
      },
    });
    if (!customerId) {
      const customer = await this.stripeClient.customers.create({
        email: contractor.email,
        name: contractor.name,
        phone: contractor.phoneNumber,
        source: token.id,
      });
      customerId = customer.id;
    } else {
      await this.stripeClient.customers.update(customerId, {
        source: token.id,
      });
    }
    return { token, customerId };
  }

  async verifyBankAccount(
    customerId: string,
    bankId: string,
    amounts: [number, number],
  ): Promise<Stripe.BankAccount> {
    try {
      return await this.stripeClient.customers.verifySource(
        customerId,
        bankId,
        {
          amounts,
        },
      );
    } catch (e) {
      throw new VerifyCodeBankAccountException();
    }
  }
}
