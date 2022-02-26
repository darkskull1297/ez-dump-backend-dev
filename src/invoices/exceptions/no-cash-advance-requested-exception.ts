import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'STRIPE006',
  'No cash advance has been requested',
);

export class NoCashAdvanceRequestedException extends BaseException {
  constructor() {
    super(
      'No cash advance has been requested',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
