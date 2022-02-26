import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('AUTH004', 'Email Already Verified');

export class AlreadyVerifiedException extends BaseException {
  constructor() {
    super('Email is already verified', errorCode, HttpStatus.BAD_REQUEST);
  }
}
