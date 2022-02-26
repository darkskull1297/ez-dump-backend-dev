import { Module } from '@nestjs/common';
import { AuthCommonModule } from '../../auth-common.module';
import { AuthContractorController } from './auth-contractor.controller';

@Module({
  imports: [AuthCommonModule],
  controllers: [AuthContractorController],
})
export class AuthContractorModule {}
