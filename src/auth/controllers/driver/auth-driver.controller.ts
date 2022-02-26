import { Controller } from '@nestjs/common';
import { AuthCommonController } from '../../auth-common.controller';
import { UserRole } from '../../../user/user.model';

@Controller('driver/auth')
export class AuthDriverController extends AuthCommonController(
  UserRole.DRIVER,
) {}
