import { Module } from '@nestjs/common';
import { UserCommonModule } from '../../user-common.module';
import { UserDriverController } from './user-driver.controller';

@Module({
  imports: [UserCommonModule],
  controllers: [UserDriverController],
})
export class UserDriverModule {}
