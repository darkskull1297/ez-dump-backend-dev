import { HttpException } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(response: string, public readonly code: string, status: number) {
    super(response, status);
  }
}
