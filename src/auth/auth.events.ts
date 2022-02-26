import { StrictEventEmitter } from 'nest-emitter';
import { EventEmitter } from 'events';

interface AuthEvents {
  ownerRegistered: {
    ownerId: string;
    ownerEmail: string;
    ownerName: string;
    companyName: string;
  };
  stripeAccountCreated: { accountId: string; ownerId: string };
}

export type AuthEventEmitter = StrictEventEmitter<EventEmitter, AuthEvents>;
