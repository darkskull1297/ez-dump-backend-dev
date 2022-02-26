import { Module } from '@nestjs/common';
import { UserCommonModule } from '../../user-common.module';
import { UserContractorController } from './user-contractor.controller';

@Module({
  imports: [UserCommonModule],
  controllers: [UserContractorController],
})
export class UserContractorModule {}
