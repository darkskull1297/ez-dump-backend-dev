import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'AUTH006',
  'Please ensure that you are accessing the correct role'
);

export class WrongRoleException extends BaseException {
  constructor() {
    super(
      'Attempting to access with wrong role',
      errorCode,
      HttpStatus.FORBIDDEN,
    );
  }
}
