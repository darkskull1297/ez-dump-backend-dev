import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'STRIPE003',
  'You have insufficient funds in your Stripe account.',
);

export class StripeBalanceInsufficientException extends BaseException {
  constructor() {
    super(
      'You have insufficient funds in your Stripe account.',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
