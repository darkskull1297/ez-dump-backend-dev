import { Module } from '@nestjs/common';
import { UserCommonModule } from '../../user-common.module';
import { UserOwnerController } from './user-owner.controller';

@Module({
  imports: [UserCommonModule],
  controllers: [UserOwnerController],
})
export class UserOwnerModule {}
