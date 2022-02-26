import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';
import { AuthEventEmitter } from './auth.events';
import { AuthService } from './auth.service';

@Injectable()
export class AuthEventsService implements OnModuleInit {
  constructor(
    @InjectEventEmitter()
    private readonly eventEmitter: AuthEventEmitter,
    private readonly authService: AuthService,
  ) {}

  onModuleInit(): void {
    this.eventEmitter.on('stripeAccountCreated', data =>
      this.onStripeAccountCreated(data),
    );
  }

  onStripeAccountCreated({ accountId, ownerId }): void {
    this.authService.setOwnerStripeAccount(ownerId, accountId);
  }
}
