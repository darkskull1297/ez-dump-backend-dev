import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('AUTH008', 'Phone number is already in use');

export class PhoneNumberInUseException extends BaseException {
  constructor() {
    super('Phone number is already in use', errorCode, HttpStatus.BAD_REQUEST);
  }
}
