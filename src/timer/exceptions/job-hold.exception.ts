import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'TIMR009',
  "You can't clock in, job is on hold",
);

export class JobOnHoldException extends BaseException {
  constructor() {
    super(
      "You can't clock in, job is on hold",
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
