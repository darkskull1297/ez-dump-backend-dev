import { forwardRef, Module } from '@nestjs/common';
import { GeneralJobCommonModule } from '../../general-job-common.module';
import { GeneralJobContractorController } from './general-job-contractor.controller';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [GeneralJobCommonModule, forwardRef(() => UserModule)],
  controllers: [GeneralJobContractorController],
})
export class GeneralJobContractorModule {}
