import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('JOBS001', 'Job is already scheduled');

export class JobScheduledException extends BaseException {
  constructor() {
    super('Job is already scheduled', errorCode, HttpStatus.BAD_REQUEST);
  }
}
