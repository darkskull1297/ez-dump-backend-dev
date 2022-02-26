import { Type, CanActivate, ExecutionContext } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseModel } from './base.model';
import { User } from '../user/user.model';
import { getReqAndResFromContext } from '../util';

export function OwnsModelGuard<T extends BaseModel>(
  model: Type<T>,
  argIdKey: string,
  condition: (
    repo: Repository<T>,
    id: string,
    currentUser: User,
  ) => Promise<boolean>,
): CanActivate {
  class OwnsModelGuardHost implements CanActivate {
    constructor(
      @InjectRepository(model)
      private readonly modelRepo: Repository<typeof model>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const { req } = getReqAndResFromContext(context);
      const { user } = req;
      const argIdValue: string = req.params[argIdKey];
      return condition(
        this.modelRepo as any,
        argIdValue,
        (user as unknown) as User,
      );
    }
  }

  return OwnsModelGuardHost as any;
}
