import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('AUTH005', 'Could not verify email');

export class InvalidVerifyEmailTokenException extends BaseException {
  constructor() {
    super('Could not verify email', errorCode, HttpStatus.UNAUTHORIZED);
  }
}
