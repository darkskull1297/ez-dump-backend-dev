import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const error = registerErrorCode(
  'AUTH007',
  `This user is logged in another device, please contact EZ DUMP TRUCK for any inconvenience`
);

export class DeviceAlreadyLoggedException extends BaseException {
  constructor() {
    super(
      `This user is logged in another device, please contact EZ DUMP TRUCK for any inconvenience.`,
      error,
      HttpStatus.BAD_REQUEST,
    );
  }
}
