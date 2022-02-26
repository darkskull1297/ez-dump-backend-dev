import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('AUTH000', 'Invalid Credentials');

export class InvalidCredentialsException extends BaseException {
  constructor() {
    super('Invalid email and/or password', errorCode, HttpStatus.UNAUTHORIZED);
  }
}
