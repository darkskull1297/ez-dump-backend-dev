import { forwardRef, Module } from '@nestjs/common';
import { JobContractorController } from './job-contractor.controller';
import { JobsCommonModule } from '../../jobs-common.module';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [JobsCommonModule, forwardRef(() => UserModule)],
  controllers: [JobContractorController],
})
export class JobContractorModule {}
