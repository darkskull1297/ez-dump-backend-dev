import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../../common/base.exception';
import { registerErrorCode } from '../../common/error-codes';

const errorCode = registerErrorCode(
    'CTOR000',
    'An active user has the same credentials as this contractor'
);

export class ContractorActiveUserCredentials extends BaseException {
  constructor() {
    super(
        'An active user has the same credentials as this contractor',
        errorCode,
        HttpStatus.BAD_REQUEST
    );
  }
}
