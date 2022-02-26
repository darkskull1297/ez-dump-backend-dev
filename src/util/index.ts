import { ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';

export function asTitle(str: string): string {
  return str.charAt(0).toUpperCase() + str.substr(1);
}

export type decoratorFunc = (
  target: object,
  key: string | symbol,
  value: any,
) => any;

export function ConditionalDecorator(
  test: boolean,
  decorator: decoratorFunc,
): decoratorFunc {
  return (target: object, key: string | symbol, value: any): any => {
    if (test) {
      decorator(target, key, value);
    }
  };
}

export function DecoratorList(...decorators: decoratorFunc[]): decoratorFunc {
  return (target: object, key: string | symbol, value: any): any => {
    decorators.forEach(decorator => decorator(target, key, value));
  };
}

export function getReqAndResFromContext(
  context: ExecutionContext,
): { req: Request; res: Response } {
  const http = context.switchToHttp();
  return {
    req: http.getRequest<Request>(),
    res: http.getResponse<Response>(),
  };
}
