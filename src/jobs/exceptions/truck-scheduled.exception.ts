import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
  'JOBS003',
  'Truck already has a scheduled job',
);

export class TruckScheduledException extends BaseException {
  constructor() {
    super(
      'Truck already has a scheduled job',
      errorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}
