import { forwardRef, Module } from '@nestjs/common';
import { BillDispatcherController } from './bill-dispatcher.controller';
import { BillCommonModule } from '../../bill-common.module';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [BillCommonModule, forwardRef(() => UserModule)],
  controllers: [BillDispatcherController],
})
export class BillDispatcherModule {}
