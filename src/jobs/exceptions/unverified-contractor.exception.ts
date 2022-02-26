import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS015',
  'You must be verified by the admin to create a job',
);

export class UnverifiedContractorException extends BaseException {
  constructor() {
    super(
      'You must be verified by the admin to create a job',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
