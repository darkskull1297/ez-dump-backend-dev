import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('JOBS017', 'General Job doesnt exist');

export class GeneralJobNotExistException extends BaseException {
  constructor() {
    super('General Job doesnt exist', errorCode, HttpStatus.BAD_REQUEST);
  }
}
