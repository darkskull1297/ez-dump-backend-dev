import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS007',
  "Can't cancel a scheduled job if it already has an active assignation",
);

export class JobScheduleRemoveException extends BaseException {
  constructor() {
    super(
      "Can't cancel a scheduled job if it already has an active assignation",
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
