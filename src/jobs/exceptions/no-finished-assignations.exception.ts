import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS010',
  'Should at least have one finished assignation',
);

export class NoFinishedAssignationsException extends BaseException {
  constructor() {
    super(
      'Should at least have one finished assignation',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
