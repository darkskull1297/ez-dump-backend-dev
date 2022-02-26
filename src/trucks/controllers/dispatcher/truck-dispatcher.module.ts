import { forwardRef, Module } from '@nestjs/common';
import { TruckDispatcherController } from './truck-dispatcher.controller';
import { TrucksCommonModule } from '../../trucks-common.module';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [TrucksCommonModule, forwardRef(() => UserModule)],
  controllers: [TruckDispatcherController],
})
export class TruckDispatcherModule {}
