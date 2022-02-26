import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'AUTH009',
  "This user doesn't exist, please get in touch with your employer for more information",
);

export class DisabledUserException extends BaseException {
  constructor() {
    super(
      "This user doesn't exist, please get in touch with your employer for more information",
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
