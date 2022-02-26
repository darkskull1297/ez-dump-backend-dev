import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS016',
  'The truck for the job has already been reviewed',
);

export class JobTruckAlreadyReviewedException extends BaseException {
  constructor() {
    super(
      'The truck for the job has already been reviewed',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
