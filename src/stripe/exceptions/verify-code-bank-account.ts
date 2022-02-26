import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'STRIPE007',
  'Verify code for bank account is incorrect',
);

export class VerifyCodeBankAccountException extends BaseException {
  constructor() {
    super(
      'Verify code for bank account is incorrect',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
