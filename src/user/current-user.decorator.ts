import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getReqAndResFromContext } from '../util';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const { req } = getReqAndResFromContext(ctx);
    return req.user;
  },
);
