import { Controller } from '@nestjs/common';
import { AuthCommonController } from '../../auth-common.controller';
import { UserRole } from '../../../user/user.model';

@Controller('foreman/auth')
export class AuthForemanController extends AuthCommonController(
  UserRole.FOREMAN,
) {}
