import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'AUTH002',
  'Email not associated with a user account'
);

export class EmailNotExistsException extends BaseException {
  constructor() {
    super(
      'Email is not associated with a user account',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
