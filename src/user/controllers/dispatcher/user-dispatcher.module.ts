import { Module } from '@nestjs/common';
import { UserCommonModule } from '../../user-common.module';
import { UserDispatcherController } from './user-dispatcher.controller';

@Module({
  imports: [UserCommonModule],
  controllers: [UserDispatcherController],
})
export class UserDispatcherModule {}
