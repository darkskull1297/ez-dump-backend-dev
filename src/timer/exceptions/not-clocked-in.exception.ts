import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('TIMR003', 'User is not clocked in');

export class NotClockedInException extends BaseException {
  constructor() {
    super('User is not clocked in', errorCode, HttpStatus.BAD_REQUEST);
  }
}
