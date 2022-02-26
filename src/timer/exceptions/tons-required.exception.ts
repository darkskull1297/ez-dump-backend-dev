import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('TIMR007', 'Tons are required');

export class TonsRequiredException extends BaseException {
  constructor() {
    super('Tons are required', errorCode, HttpStatus.BAD_REQUEST);
  }
}
