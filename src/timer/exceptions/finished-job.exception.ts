import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('TIMR005', 'Job is finished');

export class FinishedJobException extends BaseException {
  constructor() {
    super('Job is finished', errorCode, HttpStatus.BAD_REQUEST);
  }
}
