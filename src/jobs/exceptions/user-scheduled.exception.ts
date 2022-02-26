import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS002',
  'User already has a scheduled job',
);

export class UserScheduledException extends BaseException {
  constructor() {
    super(
      'User already has a scheduled job',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
