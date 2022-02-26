import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode('TRCK000', 'Truck has a scheduled job');

export class TruckJobAssigException extends BaseException {
  constructor() {
    super('Truck has a scheduled job', errorCode, HttpStatus.BAD_REQUEST);
  }
}
