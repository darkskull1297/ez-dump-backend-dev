import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'STRIPE002',
  'There was an error with stripe',
);

export class StripeErrorException extends BaseException {
  constructor() {
    super('There was an error with stripe', errorCode, HttpStatus.BAD_REQUEST);
  }
}
