import {
  ExceptionFilter,
  Catch,
  HttpException,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { IncomingMessage } from 'http';
import { BaseException } from './base.exception';
import errorCodes from './error-codes';

@Catch(HttpException)
export class RequestExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catchAsHttp(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const code = exception.getStatus();
    const msg = exception.getResponse();

    let error = {
      code: 'NULL000',
      msg: 'Generic Error',
    };
    if (exception instanceof BaseException) {
      error = errorCodes[exception.code];
    } else if (exception.getStatus() === HttpStatus.UNAUTHORIZED) {
      error = {
        code: 'AUTH998',
        msg: 'Unauthorized',
      };
    } else if (exception.getStatus() === HttpStatus.FORBIDDEN) {
      error = {
        code: 'AUTH999',
        msg: 'Forbidden',
      };
    } else if (exception.getStatus() === HttpStatus.BAD_REQUEST) {
      error = {
        code: 'BREQ999',
        msg: 'Bad Request',
      };
    }

    let obj;
    if (typeof msg === 'string') {
      obj = {
        success: false,
        error,
        statusCode: code,
        message: msg,
      };
    } else {
      obj = {
        success: false,
        ...msg,
        error,
        message: (msg as any).error,
      };
    }

    if ((msg as any).message?.length) {
      obj.validationErrors = (msg as any).message;
    }

    res.status(code).json(obj);
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    if (host.getArgByIndex(0) instanceof IncomingMessage) {
      this.catchAsHttp(exception, host);
    }
  }
}
