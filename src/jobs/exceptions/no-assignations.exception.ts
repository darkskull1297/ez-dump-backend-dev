import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS005',
  'Should at least assign a truck and driver',
);

export class NoAssignationsException extends BaseException {
  constructor() {
    super(
      'Should at least assign a truck and driver',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
