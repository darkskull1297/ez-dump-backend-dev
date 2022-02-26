import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('JOBS021', 'Job has trucks in Active');

export class JobHasActiveTrucksException extends BaseException {
  constructor() {
    super('Job has trucks in Active', errorCode, HttpStatus.BAD_REQUEST);
  }
}
