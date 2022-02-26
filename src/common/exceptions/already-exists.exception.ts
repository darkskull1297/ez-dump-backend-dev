import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';
import { registerErrorCode } from '../error-codes';

const errorCode = registerErrorCode('CONF000', 'Document Already Exists');
export class AlreadyExistsException extends BaseException {
  constructor(modelName: string, field: string, value: string) {
    super(
      `${modelName} with ${field} ${value} already exists`,
      errorCode,
      HttpStatus.CONFLICT,
    );
  }
}
