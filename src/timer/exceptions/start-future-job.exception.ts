import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'TIMR001',
  'You are trying to start a future job',
);

export class StartFutureJobException extends BaseException {
  constructor() {
    super(
      'You are trying to start a future job',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
