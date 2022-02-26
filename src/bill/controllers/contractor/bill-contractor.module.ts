import { forwardRef, Module } from '@nestjs/common';
import { BillContractorController } from './bill-contractor.controller';
import { BillCommonModule } from '../../bill-common.module';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [BillCommonModule, forwardRef(() => UserModule)],
  controllers: [BillContractorController],
})
export class BillContractorModule {}
