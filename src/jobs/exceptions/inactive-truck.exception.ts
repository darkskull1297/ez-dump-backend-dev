import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS008',
  'The selected truck is inactive',
);

export class InactiveTruckException extends BaseException {
  constructor() {
    super('The selected truck is inactive', errorCode, HttpStatus.BAD_REQUEST);
  }
}
