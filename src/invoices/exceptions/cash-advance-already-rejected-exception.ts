import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'STRIPE005',
  'Cash advance request has already been rejected',
);

export class CashAdvanceAlreadyRejectedException extends BaseException {
  constructor() {
    super(
      'Cash advance request has already been rejected',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
