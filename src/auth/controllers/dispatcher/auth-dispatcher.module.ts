import { Module } from '@nestjs/common';
import { AuthCommonModule } from '../../auth-common.module';
import { AuthDispatcherController } from './auth-dispatcher.controller';

@Module({
  imports: [AuthCommonModule],
  controllers: [AuthDispatcherController],
})
export class AuthDispatcherModule {}
