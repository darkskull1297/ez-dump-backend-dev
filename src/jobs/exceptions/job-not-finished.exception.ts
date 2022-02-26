import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('JOBS011', 'Job is not finished');

export class JobNotFinishedException extends BaseException {
  constructor() {
    super('Job is not finished', errorCode, HttpStatus.BAD_REQUEST);
  }
}
