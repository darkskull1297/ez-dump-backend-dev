import { Module } from '@nestjs/common';
import { AuthCommonModule } from '../../auth-common.module';
import { AuthForemanController } from './auth-foreman.controller';

@Module({
  imports: [AuthCommonModule],
  controllers: [AuthForemanController],
})
export class AuthForemanModule {}
