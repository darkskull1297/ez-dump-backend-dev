import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'TIMR008',
  "You can't clockin, you are more than 2000 m from the load site of the job ",
);

export class OutsideMinimalDistanceException extends BaseException {
  constructor() {
    super(
      "You can't clock-in, you are more than 2000 m from the load site of the job ",
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
