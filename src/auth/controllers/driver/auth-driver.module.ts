import { Module } from '@nestjs/common';
import { AuthCommonModule } from '../../auth-common.module';
import { AuthDriverController } from './auth-driver.controller';

@Module({
  imports: [AuthCommonModule],
  controllers: [AuthDriverController],
})
export class AuthDriverModule {}
