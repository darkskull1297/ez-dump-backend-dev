import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS014',
  'Dispute has already been reviewed',
);

export class DisputeTimePassedException extends BaseException {
  constructor() {
    super(
      'Dispute has already been reviewed',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
