import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
    'OWNR000',
    'An active user has the same credentials as this owner'
);

export class OwnerActiveUserCredentials extends BaseException {
  constructor() {
    super(
        'An active user has the same credentials as this owner',
        errorCode,
        HttpStatus.BAD_REQUEST
    );
  }
}
