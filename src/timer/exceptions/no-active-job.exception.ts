import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('TIMR004', 'User has no active jobs');

export class NoActiveJobException extends BaseException {
  constructor() {
    super('User has no active jobs', errorCode, HttpStatus.BAD_REQUEST);
  }
}
