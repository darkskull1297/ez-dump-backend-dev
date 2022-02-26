import { Module } from '@nestjs/common';
import { TrucksModule } from '../../../trucks/trucks.module';
import { UserCommonModule } from '../../user-common.module';
import { UserAdminController } from './user-admin.controller';

@Module({
  imports: [UserCommonModule, TrucksModule],
  controllers: [UserAdminController],
})
export class UserAdminModule {}
