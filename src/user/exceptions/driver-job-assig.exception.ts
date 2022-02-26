import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('DRIV000', 'Driver has a scheduled job');

export class DriverJobAssigException extends BaseException {
  constructor() {
    super('Driver has a scheduled job', errorCode, HttpStatus.BAD_REQUEST);
  }
}
