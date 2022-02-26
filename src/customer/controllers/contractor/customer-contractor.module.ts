import { forwardRef, Module } from '@nestjs/common';
import { CustomerContractorController } from './customer-contractor.controller';
import { CustomerCommonModule } from '../../customer-common.module';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [CustomerCommonModule, forwardRef(() => UserModule)],
  controllers: [CustomerContractorController],
})
export class CustomerContractorModule {}
