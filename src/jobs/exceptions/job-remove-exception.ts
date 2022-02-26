import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS006',
  "Can't cancel job if job is active or was already completed",
);

export class JobRemoveException extends BaseException {
  constructor() {
    super(
      "Can't cancel job if job is active or was already completed",
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
