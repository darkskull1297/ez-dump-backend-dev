import { StrictEventEmitter } from 'nest-emitter';
import { EventEmitter } from 'events';

interface InvoicesEvents {
  jobFinished: string;
  intentPaid: string;
  transferPaid: string;
  chargePaid: string;
  chargePending: string;
  invoicePaid: string;
  invoicePaidByCheck: string;
  invoicePaidByACH: string;
}

export type InvoicesEventEmitter = StrictEventEmitter<
EventEmitter,
InvoicesEvents
>;
