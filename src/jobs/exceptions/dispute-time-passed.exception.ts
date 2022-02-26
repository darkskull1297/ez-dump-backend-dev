import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS012',
  'Can only dispute jobs up to a day after it has been finished',
);

export class DisputeTimePassedException extends BaseException {
  constructor() {
    super(
      'Can only dispute jobs up to a day after it has been finished',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
