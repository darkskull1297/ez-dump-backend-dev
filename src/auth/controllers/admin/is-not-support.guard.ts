import { CanActivate, ExecutionContext } from '@nestjs/common';
import { getReqAndResFromContext } from '../../../util';

export class IsNotSupportGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { req } = getReqAndResFromContext(context);
    const { user } = req;
    return !user.readonly;
  }
}
