import { HttpStatus } from '@nestjs/common';
import { registerErrorCode } from '../error-codes';
import { BaseException } from '../base.exception';

const errorCode = registerErrorCode('SRVR000', 'Server Side Error');
export class TypeOrmException extends BaseException {
  constructor(error: { message: string }) {
    super(error.message, errorCode, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
