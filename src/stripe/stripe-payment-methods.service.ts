/* eslint-disable @typescript-eslint/camelcase */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectEventEmitter } from 'nest-emitter';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { AuthEventEmitter } from '../auth/auth.events';
import stripeConfig from '../config/stripe.config';

@Injectable()
export class StripePaymentMethodsService {
  public constructor(
    @InjectEventEmitter()
    private readonly eventEmitter: AuthEventEmitter,
    @InjectStripe()
    private readonly stripeClient: Stripe,
    @Inject(stripeConfig.KEY)
    private readonly stripeConf: ConfigType<typeof stripeConfig>,
  ) {}
}
