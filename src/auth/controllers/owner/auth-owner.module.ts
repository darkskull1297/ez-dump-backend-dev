import { Module } from '@nestjs/common';
import { AuthCommonModule } from '../../auth-common.module';
import { AuthOwnerController } from './auth-owner.controller';

@Module({
  imports: [AuthCommonModule],
  controllers: [AuthOwnerController],
})
export class AuthOwnerModule {}
