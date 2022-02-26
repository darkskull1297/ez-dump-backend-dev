import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';
import { registerErrorCode } from '../error-codes';

const errorCode = registerErrorCode('NFND000', 'Document Not Found');
export class DocumentNotFoundException extends BaseException {
  constructor(modelName: string, id?: string) {
    super(
      `Could not find document in ${modelName} ${id ? `with id ${id}` : ''}`,
      errorCode,
      HttpStatus.NOT_FOUND,
    );
  }
}
