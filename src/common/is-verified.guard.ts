import { Type, CanActivate, ExecutionContext } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseModel } from './base.model';
import { User } from '../user/user.model';
import { getReqAndResFromContext } from '../util';

export function IsVerifiedGuard<T extends BaseModel>(
  model: Type<T>,
  condition: (repo: Repository<T>, currentUser: User) => Promise<boolean>,
): CanActivate {
  class IsVerifiedGuardHost implements CanActivate {
    constructor(
      @InjectRepository(model)
      private readonly modelRepo: Repository<typeof model>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const { req } = getReqAndResFromContext(context);
      const { user } = req;
      return condition(this.modelRepo as any, (user as unknown) as User);
    }
  }

  return IsVerifiedGuardHost as any;
}
