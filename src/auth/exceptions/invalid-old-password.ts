import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('AUTH001', 'Invalid Old Password');

export class InvalidOldPasswordException extends BaseException {
  constructor() {
    super('Invalid Old Password', errorCode, HttpStatus.UNAUTHORIZED);
  }
}
