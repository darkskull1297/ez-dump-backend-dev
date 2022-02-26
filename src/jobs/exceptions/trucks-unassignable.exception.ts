import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS004',
  'Trucks do not match the job requirements',
);

export class TrucksUnassignableException extends BaseException {
  constructor() {
    super(
      'Trucks do not match the job requirements',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
