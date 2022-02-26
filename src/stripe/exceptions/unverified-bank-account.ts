import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'STRIPE008',
  'Bank account is not verified',
);

export class UnverifiedBankAccountException extends BaseException {
  constructor() {
    super('Bank account is not verified', errorCode, HttpStatus.BAD_REQUEST);
  }
}
