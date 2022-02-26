import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('TIMR006', 'Load is required');

export class LoadRequiredException extends BaseException {
  constructor() {
    super('Load is required', errorCode, HttpStatus.BAD_REQUEST);
  }
}
