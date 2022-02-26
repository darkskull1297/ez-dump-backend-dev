import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User, UserRole } from '../user/user.model';

export function HasRole(role: UserRole): CanActivate {
  class HasRoleHost implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const http = context.switchToHttp();
      const req = http.getRequest<Request>();

      const token = req.headers.authorization.replace('Bearer ', '');
      const user = (req.user as unknown) as User;

      return (
        user.role === role &&
        (token === user.loggedToken || user.role === 'OWNER')
      );
    }
  }
  return HasRoleHost as any;
}
