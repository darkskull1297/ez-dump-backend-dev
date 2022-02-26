import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('JOBS013', 'No dispute has been requested');

export class NoDisputeRequestedException extends BaseException {
  constructor() {
    super('No dispute has been requested', errorCode, HttpStatus.BAD_REQUEST);
  }
}
