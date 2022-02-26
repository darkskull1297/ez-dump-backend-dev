import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('AUTH003', 'Email not verified');

export class EmailNotVerifiedException extends BaseException {
  constructor() {
    super('Email is not verified', errorCode, HttpStatus.UNAUTHORIZED);
  }
}
