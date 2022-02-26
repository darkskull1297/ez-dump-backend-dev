import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('TIMR002', 'User is already clocked in');

export class ClockedInException extends BaseException {
  constructor() {
    super('User is already clocked in', errorCode, HttpStatus.BAD_REQUEST);
  }
}
