import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('JOBS020', 'Job already started');

export class JobStartedException extends BaseException {
  constructor() {
    super('Job already started', errorCode, HttpStatus.BAD_REQUEST);
  }
}
