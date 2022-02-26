import { Module } from '@nestjs/common';
import { UserCommonModule } from '../../user-common.module';
import { UserForemanController } from './user-foreman.controller';

@Module({
  imports: [UserCommonModule],
  controllers: [UserForemanController],
})
export class UserForemanModule {}
