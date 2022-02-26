import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'STRIPE004',
  'You have already applied for cash advance',
);

export class AlreadyAppliedForCashAdavanceException extends BaseException {
  constructor() {
    super(
      'You have already applied for cash advance',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
