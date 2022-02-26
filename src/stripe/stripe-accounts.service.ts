/* eslint-disable @typescript-eslint/camelcase */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectEventEmitter } from 'nest-emitter';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { AuthEventEmitter } from '../auth/auth.events';
import stripeConfig from '../config/stripe.config';

@Injectable()
export class StripeAccountsService implements OnModuleInit {
  public constructor(
    @InjectEventEmitter()
    private readonly eventEmitter: AuthEventEmitter,
    @InjectStripe()
    private readonly stripeClient: Stripe,
    @Inject(stripeConfig.KEY)
    private readonly stripeConf: ConfigType<typeof stripeConfig>,
  ) {}

  onModuleInit(): void {
    this.eventEmitter.on('ownerRegistered', data => this.createAccount(data));
  }

  async createAccount({
    ownerId,
    ownerEmail,
    ownerName,
    companyName,
  }): Promise<string> {
    const account = await this.stripeClient.accounts.create({
      type: 'express',
      email: ownerEmail,
      metadata: { ownerName: `${ownerName}`, companyName: `${companyName}` },
    });
    this.eventEmitter.emit('stripeAccountCreated', {
      accountId: account.id,
      ownerId,
    });
    return account.id;
  }

  async createAccountLink(accountId: string): Promise<string> {
    const accountLink = await this.stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: this.stripeConf.refreshUrl,
      return_url: this.stripeConf.returnUrl,
      type: 'account_onboarding',
      collect: 'eventually_due',
    });
    return accountLink.url;
  }

  async stripeAccountCompleted(
    accountId: string,
  ): Promise<Stripe.Response<Stripe.Account>> {
    const account = await this.stripeClient.accounts.retrieve(accountId);
    return account;
  }
}
