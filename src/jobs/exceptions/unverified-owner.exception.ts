import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS009',
  'You must be verified by the admin to schedule a job',
);

export class UnverifiedOwnerException extends BaseException {
  constructor() {
    super(
      'You must be verified by the admin to schedule a job',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
