import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'STRIPE001',
  'The owner has not yet completed his stripe account',
);

export class StripeAccountNotCompletedException extends BaseException {
  constructor() {
    super(
      'The owner has not yet completed his stripe account',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
